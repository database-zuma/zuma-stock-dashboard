/** Shared SQL filter builder for all API routes */

const NON_PRODUCT_EXCLUSION = `
  UPPER(COALESCE(article, '')) NOT LIKE '%SHOPPING BAG%'
  AND UPPER(COALESCE(article, '')) NOT LIKE '%HANGER%'
  AND UPPER(COALESCE(article, '')) NOT LIKE '%PAPER BAG%'
  AND UPPER(COALESCE(article, '')) NOT LIKE '%THERMAL%'
  AND UPPER(COALESCE(article, '')) NOT LIKE '%BOX LUCA%'
`;

export interface FilterParams {
  category?: string;
  branch?: string;
  gudang?: string;
  gender?: string;
  series?: string;
  color?: string;
  tier?: string;
  size?: string;
}

export function parseFilters(searchParams: URLSearchParams): FilterParams {
  return {
    category: searchParams.get("category") || undefined,
    branch:   searchParams.get("branch")   || undefined,
    gudang:   searchParams.get("gudang")   || undefined,
    gender:   searchParams.get("gender")   || undefined,
    series:   searchParams.get("series")   || undefined,
    color:    searchParams.get("color")    || undefined,
    tier:     searchParams.get("tier")     || undefined,
    size:     searchParams.get("size")     || undefined,
  };
}

export function buildWhereClause(filters: FilterParams): {
  clause: string;
  values: string[];
} {
  const conditions: string[] = [NON_PRODUCT_EXCLUSION];
  const values: string[] = [];
  let p = 1;

  if (filters.category) { conditions.push(`category = $${p++}`);       values.push(filters.category); }
  if (filters.branch)   { conditions.push(`branch = $${p++}`);         values.push(filters.branch); }
  if (filters.gudang)   { conditions.push(`nama_gudang = $${p++}`);    values.push(filters.gudang); }

  if (filters.gender) {
    if (filters.gender === "Baby & Kids") {
      conditions.push(`gender_group = 'Baby & Kids'`);
    } else {
      conditions.push(`gender_group = $${p++}`);
      values.push(filters.gender);
    }
  }

  if (filters.series)   { conditions.push(`series = $${p++}`);         values.push(filters.series); }
  if (filters.color)    { conditions.push(`group_warna = $${p++}`);    values.push(filters.color); }
  if (filters.tier)     { conditions.push(`tier = $${p++}`);           values.push(filters.tier); }
  if (filters.size)     { conditions.push(`ukuran = $${p++}`);         values.push(filters.size); }

  return {
    clause: "WHERE " + conditions.join("\n  AND "),
    values,
  };
}

/** Next param index after all filters (for appending LIMIT/OFFSET etc.) */
export function nextParamIndex(filters: FilterParams): number {
  let idx = 1;
  if (filters.category) idx++;
  if (filters.branch)   idx++;
  if (filters.gudang)   idx++;
  if (filters.gender && filters.gender !== "Baby & Kids") idx++;
  if (filters.series)   idx++;
  if (filters.color)    idx++;
  if (filters.tier)     idx++;
  if (filters.size)     idx++;
  return idx;
}
