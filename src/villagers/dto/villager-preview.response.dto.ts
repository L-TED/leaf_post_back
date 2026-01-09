export class VillagerToneItemDTO {
  toneType: string;
}

export class VillagerPreviewDTO {
  id: number;
  name: string;
  imageUrl: string;
  previewText: string; // ← 서버에서 가공된 값, 프론트에서 previewText로 사용

  // 주민 인기(누적) 지표. sort=popular 조회 시 Redis ZSET score 기반으로 내려줌.
  // Redis 장애/데이터 없음 등 fallback 상황에서는 0으로 내려갈 수 있음.
  usageCount: number;

  tones: VillagerToneItemDTO[];
}
