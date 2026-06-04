import { readGithubJson, writeGithubJson, requireAdmin, sendError, sendJson } from './_github.js';

const CONTENT_PATH = process.env.GITHUB_CONTENT_PATH || 'content/site-content.json';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const content = await readGithubJson(CONTENT_PATH, null);
      sendJson(res, 200, {
        ok: true,
        content
      });
      return;
    }

    if (req.method === 'PUT') {
      requireAdmin(req);
      const content = req.body?.content;

      if (!content || typeof content !== 'object') {
        const error = new Error('Content payload is required');
        error.statusCode = 400;
        throw error;
      }

      const savedContent = {
        ...content,
        updatedAt: new Date().toISOString()
      };

      await writeGithubJson(CONTENT_PATH, savedContent, 'Update site content from Vercel admin');

      sendJson(res, 200, {
        ok: true,
        content: savedContent
      });
      return;
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    sendJson(res, 405, {
      ok: false,
      message: 'Method not allowed'
    });
  } catch (error) {
    sendError(res, error, 'Content request failed');
  }
}
