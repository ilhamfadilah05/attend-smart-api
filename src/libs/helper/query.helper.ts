import { Injectable } from '@nestjs/common';

export interface IFilter {
  param: string;
  column: string;
  operator: string;
  enum?: string[];
  enumUppercase?: boolean;
}

export interface filterOption {
  queryString: Record<string, any>;
  params: any[];
  delete?: {
    isNull?: boolean;
    value?: string;
  };
  created_at?: {
    between: boolean;
    value: string;
  };
}

@Injectable()
export class QueryHelper {
  private readonly listSortParam = ['date'];
  constructor() {}

  private whereQuery(filterData: IFilter, value: string) {
    if (filterData.operator === 'BETWEEN') {
      return `${filterData.column} BETWEEN `;
    }

    return `${filterData.column} ${filterData.operator} $${value}`;
  }

  pagination(page: number, limit: number) {
    page = Number(page ? page : 1);
    limit = Number(limit ? limit : 10);
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  update<T>(id: string, updateData: T, nullablesValue?: string[]) {
    for (const data in updateData) {
      if (
        (nullablesValue !== undefined &&
          nullablesValue.includes(data) &&
          updateData[data] === null) ||
        updateData[data] === undefined
      ) {
        continue;
      }
      if (
        updateData[data] === null ||
        updateData[data] === undefined ||
        (typeof updateData[data] === 'string' && updateData[data].length === 0)
      ) {
        delete updateData[data];
      }
    }

    let update = '';
    let count = 1;
    const keys = Object.keys(updateData);
    const params = [];
    for (let i = 0; i < keys.length; i++) {
      const value = updateData[keys[i]];

      if (
        nullablesValue !== undefined &&
        nullablesValue.includes(keys[i]) &&
        value === null
      ) {
        update +=
          `${keys[i]} = $${count}` + (i !== keys.length - 1 ? ', ' : '');
        params.push(null);
        count++;
        continue;
      }

      if (value === null) continue;

      if (value instanceof Date) {
        update +=
          `${keys[i]} = $${count}` + (i !== keys.length - 1 ? ', ' : '');
        params.push(value);
        count++;
        continue;
      }

      if (
        typeof value === 'string' &&
        value !== undefined &&
        value !== null &&
        value.length > 0
      ) {
        update +=
          `${keys[i]} = $${count}` + (i !== keys.length - 1 ? ', ' : '');
        params.push(value);
        count++;
        continue;
      }

      if (typeof value === 'number' && value !== undefined && value !== null) {
        update +=
          `${keys[i]} = $${count}` + (i !== keys.length - 1 ? ', ' : '');
        params.push(value);
        count++;
        continue;
      }

      if (typeof value === 'boolean' && value !== undefined && value !== null) {
        update +=
          `${keys[i]} = $${count}` + (i !== keys.length - 1 ? ', ' : '');
        params.push(value);
        count++;
      }
    }

    params.push(id);

    update += update.length > 0 ? ', updated_at = NOW()' : 'updated_at = NOW()';

    return {
      updateQuery: update,
      params,
    };
  }

  search(
    filterData: IFilter[],
    { queryString, params, delete: isDelete, created_at }: filterOption,
  ) {
    let stateWhere = params.length;
    let stateCount = 0;
    const query = [];

    for (const prop in queryString) {
      if (
        queryString[prop] !== undefined ||
        queryString[prop] !== null ||
        (typeof queryString[prop] === 'string' && queryString[prop].length > 0)
      ) {
        query.push(prop);
      }
    }

    let where = '';
    let whereCount = '';
    let paramCount = [];
    for (let i = 0; i < filterData.length; i++) {
      if (query.includes(filterData[i].param)) {
        // validate enum
        if (filterData[i]?.enum?.length > 0) {
          if (
            !filterData[i].enum.includes(
              filterData[i].enumUppercase
                ? queryString[filterData[i].param].toUpperCase()
                : queryString[filterData[i].param],
            )
          ) {
            continue;
          }
        }

        where +=
          where.length === 0
            ? 'WHERE ' +
              this.whereQuery(filterData[i], (stateWhere + 1).toString()) +
              ' '
            : 'AND ' +
              this.whereQuery(filterData[i], (stateWhere + 1).toString()) +
              ' ';
        whereCount +=
          whereCount.length === 0
            ? 'WHERE ' +
              this.whereQuery(filterData[i], (stateCount + 1).toString()) +
              ' '
            : 'AND ' +
              this.whereQuery(filterData[i], (stateCount + 1).toString()) +
              ' ';

        if (filterData[i].operator === 'ILIKE') {
          params.push(`%${queryString[filterData[i].param]}%`);
          paramCount.push(`%${queryString[filterData[i].param]}%`);
        } else if (filterData[i]?.enum?.length > 0) {
          const param = `${filterData[i].enumUppercase ? queryString[filterData[i].param].toUpperCase() : queryString[filterData[i].param]}`;
          params.push(param);
          paramCount.push(param);
        } else {
          params.push(queryString[filterData[i].param]);
          paramCount.push(queryString[filterData[i].param]);
        }
        stateWhere++;
        stateCount++;
      }
    }

    if (isDelete?.isNull) {
      const q = isDelete?.value
        ? `${isDelete.value} IS NULL`
        : 'deleted_at IS NULL';
      where += where.length > 0 ? `AND ${q}` : `WHERE ${q}`;
      whereCount += whereCount.length > 0 ? `AND ${q}` : `WHERE ${q}`;
    }

    if (
      (queryString?.created_at_gte || queryString?.created_at_lte) &&
      created_at.between
    ) {
      let q = `${created_at.value} BETWEEN $${params.length + 1} AND $${params.length + 2}`;
      let c = `${created_at.value} BETWEEN $${paramCount.length + 1} AND $${paramCount.length + 2}`;
      let createdAtParam = [
        queryString.created_at_gte,
        queryString.created_at_lte,
      ];

      if (queryString.created_at_gte && !queryString.created_at_lte) {
        q = `${created_at.value} >= $${params.length + 1}`;
        c = `${created_at.value} >= $${paramCount.length + 1}`;
        createdAtParam = [queryString.created_at_gte];
      }
      if (!queryString.created_at_gte && queryString.created_at_lte) {
        q = `${created_at.value} <= $${params.length + 1}`;
        c = `${created_at.value} <= $${paramCount.length + 1}`;
        createdAtParam = [queryString.created_at_lte];
      }
      where += where.length > 0 ? ` AND ${q}` : q;
      whereCount += whereCount.length > 0 ? ` AND ${c}` : c;
      params = params.concat(createdAtParam);
      paramCount = paramCount.concat(createdAtParam);
    }

    return {
      where: {
        q: where,
        c: whereCount,
      },
      param: {
        q: params,
        c: paramCount,
      },
    };
  }

  sort(value: string | undefined, params: string[] = []) {
    const regex = /^[a-zA-Z_]+-(asc|desc)+$/;
    if (!regex.test(value)) {
      return undefined;
    }

    if (params.length === 0) {
      params = params.concat(this.listSortParam);
    }

    const splitedValue = value.split('-');

    let param = splitedValue[0].toLowerCase();
    const keyword = splitedValue[1].toLowerCase();

    let result = undefined;
    for (const sortParam of params) {
      const tempPar = sortParam.split('.');
      let hasTable = false;
      let checkParam = sortParam;

      if (tempPar.length > 1) {
        hasTable = true;
        checkParam = tempPar[1];
      }

      if (param === 'role') {
        param = 'name';
      }

      if (checkParam.toLowerCase() === param) {
        let column = param;
        switch (param) {
          case 'date':
            column = 'created_at';
            break;
          case 'transid':
            column = 'trans_id';
            break;
          case 'createdat':
            column = 'created_at';
            break;
        }

        if (hasTable) {
          column = tempPar[0] + '.' + column;
        }

        if (keyword === 'asc') {
          result = `${column} ASC`;
        }

        if (keyword === 'desc') {
          result = `${column} DESC`;
        }
        break;
      }
    }
    return result;
  }
}
