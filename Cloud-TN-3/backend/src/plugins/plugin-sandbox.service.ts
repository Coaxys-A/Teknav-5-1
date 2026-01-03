import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PluginSandboxService {
  private readonly logger = new Logger(PluginSandboxService.name);
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    binding: { pluginId: number; pluginVersion?: any; sandbox?: any },
    payload: any,
    meta?: { tenantId?: number; traceId?: string; spanId?: string },
  ) {
    const start = Date.now();

    const sandboxConfig = binding.sandbox ?? { runtime: 'vm2', permissions: [] };
    const signatureValid = await this.verifySignature(binding.pluginVersion?.manifest, sandboxConfig?.signature);
    let output: any = { ok: true, signatureValid, runtime: sandboxConfig.runtime, echo: payload ?? {}, meta };

    if (sandboxConfig.runtime === 'vm2') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { NodeVM } = require('vm2');
        const vm = new NodeVM({
          console: 'redirect',
          sandbox: { payload, meta },
          require: { external: false },
          timeout: 1000,
        });
        const code = binding.pluginVersion?.manifest?.code ?? 'module.exports = (payload) => payload;';
        const handler = vm.run(code);
        output = await Promise.resolve(handler(payload, meta));
      } catch (err) {
        this.logger.warn(`VM2 execution fallback: ${String(err)}`);
        output = { ok: false, error: String(err), runtime: 'vm2' };
      }
    } else if (sandboxConfig.runtime === 'wasm' && binding.pluginVersion?.manifest?.wasm) {
      output = { ok: true, runtime: 'wasm', note: 'WASM execution hook not implemented; manifest present' };
    }

    const durationMs = Date.now() - start;
    return { output, durationMs };
  }

  async verifySignature(manifest: any, signature?: string | null) {
    if (!signature) return true;
    // TODO: real verification hook; stubbed to true for now.
    return true;
  }
}
