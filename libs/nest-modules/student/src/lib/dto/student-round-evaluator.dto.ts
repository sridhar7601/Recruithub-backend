import { IsString, IsEmail, IsUUID } from 'class-validator';

export class StudentRoundEvaluatorDto {
  @IsString()
  employeeId: string;

  @IsString()
  name: string;

  @IsEmail()
  emailId: string;
}
