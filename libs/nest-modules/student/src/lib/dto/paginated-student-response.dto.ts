import { Student } from '../student.schema';

export class PaginatedStudentResponseDto {
  data: Student[];
  total: number;
  page: number;
  limit: number;
}
