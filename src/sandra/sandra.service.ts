import { HttpService } from '@nestjs/axios';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ErrorHelper } from 'src/libs/helper/error.helper';
import { SandraHelperService } from 'src/libs/service/sandra/sandra.service';
import { ListSandraProjectDto } from './dto/list-sandra-project.dto';


@Injectable()
export class SandraService {
  constructor(
    private readonly httpService: HttpService,
    private readonly error: ErrorHelper,
    private readonly sandra: SandraHelperService,
  ) {}

  async findProgram() {
    try {
      const url = process.env.SANDRA_URI + '/service-h2h/echannel/program';

      console.log(url);
      const token = await this.sandra.authToken();
      console.log(token);
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'api-key': process.env.SANDRA_API_KEY,
            Authorization: `Bearer ${token}`,
          },
        }),
      );
      return response.data;
    } catch (error) {
      console.log(error);
      if (error instanceof AxiosError) {
        throw new ServiceUnavailableException('Service not available');
      }

      this.error.handleError(
        error,
        `${SandraService.name}.${this.findProgram.name}`,
      );
    }
  }

  async findProject(query: ListSandraProjectDto) {
    try {
      let searchConditions = '';

      if (query.sandra_program_uuid) {
        searchConditions = 'program_uuid=' + query.sandra_program_uuid;
      }
      const url =
        process.env.SANDRA_URI +
        '/service-h2h/echannel/project' +
        `?name=${query.name ?? ''}&${searchConditions}`;
      const token = await this.sandra.authToken();
      const response: any = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'api-key': process.env.SANDRA_API_KEY,
            Authorization: `Bearer ${token}`,
          },
        }),
      );
      return response.data;
    } catch (error) {
      console.log(error);
      if (error instanceof AxiosError) {
        throw new ServiceUnavailableException('Service not available');
      }

      this.error.handleError(
        error,
        `${SandraService.name}.${this.findProject.name}`,
      );
    }
  }

  async findQurban() {
    try {
      const url = process.env.SANDRA_URI + '/service-h2h/echannel/hewan';
      const token = await this.sandra.authToken();
      const response: any = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'api-key': process.env.SANDRA_API_KEY,
            Authorization: `Bearer ${token}`,
          },
        }),
      );
      return response.data;
    } catch (error) {
      console.log(error);
      if (error instanceof AxiosError) {
        throw new ServiceUnavailableException('Service not available');
      }

      this.error.handleError(
        error,
        `${SandraService.name}.${this.findProject.name}`,
      );
    }
  }
}
