import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import sharp from 'sharp';
import sizeOf from 'image-size';
import type { Express } from 'express';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  private cdn(url: string) {
    const base = process.env.CDN_BASE_URL;
    if (!base) return url;
    return `${base.replace(/\/$/, '')}${url}`;
  }

  async saveFile(file: Express.Multer.File, userId?: number) {
    const id = randomBytes(8).toString('hex');
    const baseName = `${id}${extname(file.originalname)}`;
    const uploadDir = join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const originalPath = join(uploadDir, baseName);
    fs.writeFileSync(originalPath, file.buffer);

    const sizes = [
      { suffix: 'sm', width: 320 },
      { suffix: 'md', width: 720 },
      { suffix: 'lg', width: 1280 },
    ];

    let width: number | undefined;
    let height: number | undefined;
    try {
      const dim = sizeOf(file.buffer);
      width = dim.width;
      height = dim.height;
    } catch {
      // ignore
    }

    const urls: Record<string, string | undefined> = {
      original: this.cdn(`/uploads/${baseName}`),
    };

    for (const s of sizes) {
      const outName = `${id}-${s.suffix}${extname(file.originalname)}`;
      const outPath = join(uploadDir, outName);
      try {
        await sharp(file.buffer).resize({ width: s.width, withoutEnlargement: true }).toFile(outPath);
        urls[s.suffix] = this.cdn(`/uploads/${outName}`);
      } catch {
        // fallback: copy original
        fs.copyFileSync(originalPath, outPath);
        urls[s.suffix] = this.cdn(`/uploads/${outName}`);
      }
    }

    return this.prisma.file.create({
      data: {
        urlOriginal: urls.original!,
        urlSmall: urls.sm,
        urlMedium: urls.md,
        urlLarge: urls.lg,
        mimeType: file.mimetype,
        size: file.size,
        width,
        height,
        uploadedById: userId,
      },
    });
  }

  async findById(id: number) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) {
      throw new NotFoundException('FILE_NOT_FOUND');
    }
    return file;
  }

  async list(search?: string, folder?: string) {
    return this.prisma.file.findMany({
      where: {
        ...(folder ? { urlOriginal: { contains: folder } } : {}),
        ...(search ? { urlOriginal: { contains: search } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async updateMeta(id: number, meta: { alt?: string; caption?: string; folder?: string }) {
    // Metadata fields are not present in schema; keep noop update for forward compatibility
    return this.prisma.file.findUnique({ where: { id } });
  }
}
