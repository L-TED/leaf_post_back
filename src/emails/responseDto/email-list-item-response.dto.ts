// id: 클릭해서 상세 보기 위한 식별자
// status: 프론트에서 예약 상태 확인/UI 배지, 필터에 사용
// receiverEmail: 프론트에서 수신자 이메일 확인용
// scheduledAt: 프론트에서 예약 일시 확인용
// createdAt: 프론트에서 생성 일시 확인용
// villagerId: 상세 조회 시 추가 api 요청 없이 참조 가능하도록
// villagerName: Join 결과, 프론트에서 추가 api 요청 없이 참조 가능하도록
// villagerImageUrl: 주민 카드 썸네일, UI 성능/단순화 목적

export class EmailListItemResponseDto {
  id: string;
  status: 'reserved' | 'sent' | 'canceled' | 'failed';
  receiverEmail: string;
  subject: string;
  originalText: string;
  scheduledAt: Date;
  createdAt: Date | null;
  villagerId: number;
  villagerName: string;
  villagerImageUrl: string;
}
