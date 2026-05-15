function cleanObject(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

function numberOrUndefined(value) {
  if (!value) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function getBitrixMethodUrl(method) {
  const webhookUrl = process.env.BITRIX_WEBHOOK_URL;

  if (!webhookUrl) {
    return null;
  }

  const normalizedUrl = webhookUrl.replace(/\/+$/, '');

  if (normalizedUrl.endsWith('.json')) {
    return normalizedUrl;
  }

  if (/crm\.[a-z.]+$/i.test(normalizedUrl)) {
    return `${normalizedUrl}.json`;
  }

  return `${normalizedUrl}/${method}.json`;
}

function buildComments(lead) {
  return [
    'Заявка с сайта Эталон — премиальный клининг',
    '',
    `Объект: ${lead.object || 'не указано'}`,
    `Площадь: ${lead.area || 'не указано'}`,
    `Частота: ${lead.frequency || 'не указано'}`,
    `Что важно: ${lead.details || 'не указано'}`,
    `Контакт: ${lead.contact}`,
    `Источник: ${lead.source}`,
    `Дата заявки: ${lead.createdAt}`,
    `ID заявки на backend: ${lead.id}`
  ].join('\n');
}

function buildLeadPayload(lead) {
  return {
    fields: cleanObject({
      TITLE: 'Заявка с сайта Эталон — клининг',
      NAME: 'Заявка с сайта',
      SOURCE_ID: process.env.BITRIX_SOURCE_ID || 'WEB',
      STATUS_ID: process.env.BITRIX_STATUS_ID,
      ASSIGNED_BY_ID: numberOrUndefined(process.env.BITRIX_ASSIGNED_BY_ID),
      PHONE: [
        {
          VALUE: lead.contact,
          VALUE_TYPE: 'WORK'
        }
      ],
      COMMENTS: buildComments(lead)
    }),
    params: {
      REGISTER_SONET_EVENT: 'Y'
    }
  };
}

function buildDealPayload(lead) {
  return {
    fields: cleanObject({
      TITLE: 'Заявка с сайта Эталон — клининг',
      SOURCE_ID: process.env.BITRIX_SOURCE_ID || 'WEB',
      CATEGORY_ID: numberOrUndefined(process.env.BITRIX_CATEGORY_ID),
      STAGE_ID: process.env.BITRIX_STAGE_ID,
      ASSIGNED_BY_ID: numberOrUndefined(process.env.BITRIX_ASSIGNED_BY_ID),
      COMMENTS: buildComments(lead)
    }),
    params: {
      REGISTER_SONET_EVENT: 'Y'
    }
  };
}

export async function sendToBitrix(lead) {
  const entityType = String(process.env.BITRIX_ENTITY_TYPE || 'lead').toLowerCase();
  const method = entityType === 'deal' ? 'crm.deal.add' : 'crm.lead.add';
  const url = getBitrixMethodUrl(method);

  if (!url) {
    return {
      ok: true,
      skipped: true,
      message: 'BITRIX_WEBHOOK_URL is not configured'
    };
  }

  const payload = entityType === 'deal' ? buildDealPayload(lead) : buildLeadPayload(lead);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json().catch(() => null);

  if (!response.ok || result?.error) {
    const message = result?.error_description || result?.error || `Bitrix request failed with status ${response.status}`;
    throw new Error(message);
  }

  return {
    ok: true,
    skipped: false,
    entityType,
    entityId: result?.result,
    raw: result
  };
}
