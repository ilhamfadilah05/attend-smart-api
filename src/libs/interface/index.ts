import { HttpStatus } from '@nestjs/common';

export interface ResponseBody {
  statusCode: number;
  message: string;
  error: string | any;
}

export interface CaslRoleDecorator {
  action: string;
  subject: string;
}

export interface IJwtPayload {
  id: string;
  email: string;
  name: string;
  roleId: string;
  roleName: string;
  iat: number;
  exp: number;
}

export interface DefaultAccess {
  subject: string;
  action: string;
  desc?: string;
  name?: string;
}

export interface IResponseFormat<T> {
  success: boolean;
  statusCode: HttpStatus | string;
  message: string;
  data?: T;
  page?: number;
  totalData?: number;
  pageSize?: number;
}

export interface IResponseErrorFormat {
  statusCode: HttpStatus | number;
  message: string | object;
  error?: string | object;
}

export interface IAccess {
  action: string;
  subject: string;
  description: string;
}

export interface ISendMail<T = Record<string, any>> {
  to: string | string[];
  subject: string;
  text?: string;
  template?: 'forgot-password' | 'otp' | 'none';
  data?: T;
}

export interface PermissionRole {
  action: string;
  subject: string;
}

export interface DataAccessCategory {
  name: string;
  status: string;
  access?: DefaultAccess[];
  access_hide?: DefaultAccess[];
}

export interface IUpdateSalary {
  id_employee?: string;
  base_salary?: number;
  meal_allowance?: number;
  health_allowance?: number;
  bonus_amount?: number;
  absence_deduction_amount?: number;
  overtime_amount?: number;
}

export interface IUpdateSubmission {
  id_employee?: string;
  type?: string;
  status?: string;
  reason?: string;
  image?: string;
  start_date?: Date;
  end_date?: Date;
}

export interface IUpdateEmployee {
  id_user?: string;
  id_department?: string;
  id_branch?: string;
  id_salary?: string;
  name?: string;
  phone?: string;
  gender?: string;
  address?: string;
  image?: string;
}

export interface IUpdateHistory {
  id_employee?: string;
  id_department?: string;
  id_branch?: string;
  lat_long?: string;
  date_attend?: Date;
  delayed?: number;
  type?: string;
  address?: string;
  image?: string;
}

export interface IUpdateBroadcastSend {
  id_broadcast?: string;
  id_employee?: string;
  is_read?: boolean;
}

export interface IUpdateCampaign {
  name?: string;
  type?: string;
  slug?: string;
  is_highlighted?: boolean;
  campaign_group_id?: string;
  target_date?: any; // timestamp
  description?: string;
  campaign_target?: number;
  city_id?: number;
  category?: string;
  is_publish?: boolean;
  image?: string;
  price?: number;
  discount_price?: number;
  max_weight?: number;
  min_weight?: number;
  stock?: number;
  max_profile_names?: number;
  sandra_project_uuid?: string;
  sandra_program_uuid?: string;
  thk_livestock_campaign_uuid?: string;
}
