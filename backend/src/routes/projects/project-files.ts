import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { pipeline } from 'stream/promises';
import { createWriteStream, existsSync, unlinkSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { projects } from '../../db/schema.js';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'business-cases');
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc'];
const ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

export async function projectFilesRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // Ensure upload directory exists
  await mkdir(UPLOAD_DIR, { recursive: true });

  // POST /api/projects/:id/business-case - Upload business case file
  fastify.post<{ Params: { id: string } }>(
    '/:id/business-case',
    async (request, reply) => {
      const id = parseInt(request.params.id);

      // Verify project exists
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id));

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      // Get the uploaded file
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      // Validate file type by extension
      const ext = path.extname(data.filename).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        // Consume the file stream to prevent hanging
        await data.toBuffer();
        return reply.code(400).send({
          error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
        });
      }

      // Validate MIME type
      if (!ALLOWED_MIMETYPES.includes(data.mimetype)) {
        await data.toBuffer();
        return reply.code(400).send({
          error: 'Invalid file MIME type',
        });
      }

      // Generate safe filename (CRITICAL: don't use user-provided filename)
      const safeFilename = `${randomUUID()}${ext}`;
      const filepath = path.join(UPLOAD_DIR, safeFilename);

      // SECURITY: Verify resolved path is within upload directory
      if (!filepath.startsWith(UPLOAD_DIR)) {
        await data.toBuffer();
        return reply.code(400).send({ error: 'Invalid file path' });
      }

      try {
        // Delete old file if exists
        if (project.businessCaseFile) {
          const oldPath = path.join(UPLOAD_DIR, project.businessCaseFile);
          if (oldPath.startsWith(UPLOAD_DIR) && existsSync(oldPath)) {
            unlinkSync(oldPath);
          }
        }

        // Stream file to disk (no memory accumulation)
        await pipeline(data.file, createWriteStream(filepath));

        // Check if stream was truncated (file too large)
        if (data.file.truncated) {
          // Delete the incomplete file
          if (existsSync(filepath)) {
            unlinkSync(filepath);
          }
          return reply.code(400).send({
            error: 'File too large. Maximum size is 10MB.',
          });
        }

        // Update project record
        const userEmail = request.user?.email || 'dev-user';
        const [updated] = await db
          .update(projects)
          .set({
            businessCaseFile: safeFilename,
            version: project.version + 1,
            updatedBy: userEmail,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, id))
          .returning();

        return {
          filename: safeFilename,
          originalFilename: data.filename,
          size: data.file.bytesRead,
          project: {
            id: updated.id,
            businessCaseFile: updated.businessCaseFile,
            version: updated.version,
          },
        };
      } catch (err) {
        // Clean up file on error
        if (existsSync(filepath)) {
          unlinkSync(filepath);
        }
        throw err;
      }
    }
  );

  // GET /api/projects/:id/business-case/download - Download business case file
  fastify.get<{ Params: { id: string } }>(
    '/:id/business-case/download',
    async (request, reply) => {
      const id = parseInt(request.params.id);

      // Get project and verify file exists
      const [project] = await db
        .select({
          id: projects.id,
          businessCaseFile: projects.businessCaseFile,
        })
        .from(projects)
        .where(eq(projects.id, id));

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      if (!project.businessCaseFile) {
        return reply.code(404).send({ error: 'No business case file uploaded' });
      }

      // Build safe path
      const filepath = path.join(UPLOAD_DIR, project.businessCaseFile);

      // SECURITY: Verify path is within upload directory
      if (!filepath.startsWith(UPLOAD_DIR)) {
        return reply.code(403).send({ error: 'Access denied' });
      }

      // Check file exists
      if (!existsSync(filepath)) {
        return reply.code(404).send({ error: 'File not found on disk' });
      }

      // Determine content type from extension
      const ext = path.extname(project.businessCaseFile).toLowerCase();
      const contentType = ext === '.pdf'
        ? 'application/pdf'
        : ext === '.docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/msword';

      // Send file
      return reply
        .header('Content-Type', contentType)
        .header('Content-Disposition', `attachment; filename="business-case${ext}"`)
        .sendFile(project.businessCaseFile, UPLOAD_DIR);
    }
  );

  // DELETE /api/projects/:id/business-case - Remove business case file
  fastify.delete<{ Params: { id: string } }>(
    '/:id/business-case',
    async (request, reply) => {
      const id = parseInt(request.params.id);

      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id));

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      if (!project.businessCaseFile) {
        return reply.code(404).send({ error: 'No business case file to delete' });
      }

      // Delete file from disk
      const filepath = path.join(UPLOAD_DIR, project.businessCaseFile);
      if (filepath.startsWith(UPLOAD_DIR) && existsSync(filepath)) {
        unlinkSync(filepath);
      }

      // Update project record
      const userEmail = request.user?.email || 'dev-user';
      const [updated] = await db
        .update(projects)
        .set({
          businessCaseFile: null,
          version: project.version + 1,
          updatedBy: userEmail,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning();

      return { success: true, project: { id: updated.id, version: updated.version } };
    }
  );
}
