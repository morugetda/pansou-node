import { getConfig } from '../config.js';
import { getHttpClient } from '../utils/http.js';
import { parseLinks, detectCloudType, CloudType } from '../utils/cloud-type.js';

export interface TelegramSearchResult {
  message_id: string;
  unique_id: string;
  channel: string;
  datetime: string;
  title: string;
  content: string;
  links: Array<{
    type: CloudType;
    url: string;
    password?: string;
    datetime?: string;
    work_title?: string;
  }>;
  tags?: string[];
  images?: string[];
}

export interface TelegramSearchOptions {
  channels?: string[];
  conc?: number;
  refresh?: boolean;
}

export class TelegramSearchService {
  private config: ReturnType<typeof getConfig>;
  private httpClient: ReturnType<typeof getHttpClient>;

  constructor() {
    this.config = getConfig();
    this.httpClient = getHttpClient();
  }

  async search(keyword: string, options?: TelegramSearchOptions): Promise<TelegramSearchResult[]> {
    const channels = options?.channels || this.config.defaultChannels;
    const conc = options?.conc || this.config.defaultConcurrency;
    
    const results: TelegramSearchResult[] = [];
    const batches = this.chunkArray(channels, conc);

    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(channel => this.searchChannel(channel, keyword))
      );
      
      for (const channelResults of batchResults) {
        results.push(...channelResults);
      }
    }

    return results;
  }

  private async searchChannel(channel: string, keyword: string): Promise<TelegramSearchResult[]> {
    try {
      // 尝试多个API端点
      const endpoints = [
        `https://tgsou.com/api/v1/search`,
        `https://tgsearch-api.vercel.app/api/search`,
        `https://api.summerlost.xyz/api/search`
      ];
      
      console.log(`[TelegramSearch] 搜索频道: ${channel}, 关键词: ${keyword}`);
      
      for (const apiUrl of endpoints) {
        try {
          console.log(`[TelegramSearch] 尝试API端点: ${apiUrl}`);
          
          const response = await this.httpClient.post(apiUrl, {
            channel,
            keyword,
            limit: 50
          });

          console.log(`[TelegramSearch] 频道 ${channel} 响应状态: ${response?.status || '无响应'}`);

          if (!response.data?.messages) {
            console.log(`[TelegramSearch] 频道 ${channel} 无消息数据，尝试下一个端点`);
            continue;
          }

          const results = response.data.messages.map((msg: any, index: number) => {
            const fullText = `${msg.text || ''} ${msg.caption || ''}`;
            const links = parseLinks(fullText);

            return {
              message_id: String(msg.id || index),
              unique_id: `${channel}-${msg.id || index}`,
              channel: channel,
              datetime: new Date(msg.date * 1000).toISOString(),
              title: this.extractTitle(msg.text || msg.caption || ''),
              content: this.extractContent(msg.text || msg.caption || ''),
              links: links.map(link => ({
                type: link.type,
                url: link.url,
                password: link.password,
                datetime: new Date(msg.date * 1000).toISOString()
              }))
            };
          });

          console.log(`[TelegramSearch] 频道 ${channel} 搜索成功，结果数量: ${results.length}`);
          return results;
        } catch (error) {
          console.error(`[TelegramSearch] 频道 ${channel} 端点 ${apiUrl} 搜索失败:`, error instanceof Error ? error.message : String(error));
          continue;
        }
      }

      console.log(`[TelegramSearch] 频道 ${channel} 所有端点都失败`);
      return [];
    } catch (error) {
      console.error(`[TelegramSearch] 频道 ${channel} 搜索失败:`, error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  

  private extractTitle(text: string): string {
    if (!text) return '';
    const lines = text.split('\n');
    return lines[0].substring(0, 200) || '无标题';
  }

  private extractContent(text: string): string {
    if (!text) return '';
    const lines = text.split('\n');
    return lines.slice(1).join('\n').substring(0, 1000);
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

let globalTelegramSearch: TelegramSearchService | null = null;

export function getTelegramSearch(): TelegramSearchService {
  if (!globalTelegramSearch) {
    globalTelegramSearch = new TelegramSearchService();
  }
  return globalTelegramSearch;
}