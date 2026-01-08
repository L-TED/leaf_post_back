// id: 클릭해서 상세 보기 위한 식별자
// status: 프론트에서 예약 상태 확인/UI 배지, 필터에 사용
// senderEmail: 누가 보냈는지 명확히 보여주기, 서버에서 user.email로 결정된 값
// receiverEmail: 프론트에서 수신자 이메일 확인용
// originalText: 변환 전 텍스트, 비교/확인용
// transformedText: 실제 발송되는 변환 최종 결과, 이 서비스의 핵심 산출물
// scheduledAt: 프론트에서 예약 일시 확인용
// createdAt: 프론트에서 생성 일시 확인용
// villagerId: 상세 조회 시 추가 api 요청 없이 참조 가능하도록
// villagerName: Join 결과, 프론트에서 추가 api 요청 없이 참조 가능하도록
// villagerImageUrl: 주민 카드 썸네일, UI 성능/단순화 목적ㅋ

export class EmailDetailResponseDto {
  id: string;
  status: 'reserved' | 'sent' | 'canceled' | 'failed';
  receiverEmail: string;
  senderEmail: string;
  originalText: string;
  transformedText: string;
  scheduledAt: Date;
  createdAt: Date | null;
  villagerId: number;
  villagerName: string;
  villagerImageUrl: string;
}
