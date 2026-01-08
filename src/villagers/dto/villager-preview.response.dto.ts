export class VillagerToneItemDTO {
  toneType: string;
}

export class VillagerPreviewDTO {
  id: number;
  name: string;
  imageUrl: string;
  previewText: string; // ← 서버에서 가공된 값, 프론트에서 previewText로 사용
  tones: VillagerToneItemDTO[];
}
