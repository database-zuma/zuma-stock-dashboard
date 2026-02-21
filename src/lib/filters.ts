/** Shared SQL filter builder for all API routes */

const NON_PRODUCT_EXCLUSION = `
  UPPER(COALESCE(article, '')) NOT LIKE '%SHOPPING BAG%'
  AND UPPER(COALESCE(article, '')) NOT LIKE '%HANGER%'
  AND UPPER(COALESCE(article, '')) NOT LIKE '%PAPER BAG%'
  AND UPPER(COALESCE(article, '')) NOT LIKE '%THERMAL%'
  AND UPPER(COALESCE(article, '')) NOT LIKE '%BOX LUCA%'
`;

export interface FilterParams {
  branch?: string;
  gender?: string;
  tier?: string;
  category?: string;
}

export function parseFilters(searchParams: URLSearchParams): FilterParams {
  return {
    branch: searchParams.get("branch") || undefined,
    gender: searchParams.get("gender") || undefined,
    tier: searchParams.get("tier") || undefined,
    category: searchParams.get("category") || undefined,
  };
}

export function buildWhereClause(filters: FilterParams): {
  clause: string;
  values: (string | string[])[];
} {
  const conditions: string[] = [NON_PRODUCT_EXCLUSION];
  const values: string[] = [];
  let paramIndex = 1;

  if (filters.branch) {
    conditions.push(`gudang_branch = $${paramIndex}`);
    values.push(filters.branch);
    paramIndex++;
  }

  if (filters.gender) {
    if (filters.gender === "Baby & Kids") {
      conditions.push(
        `UPPER(gender) IN ('BABY','BOYS','GIRLS','JUNIOR','KIDS')`
      );
    } else {
      conditions.push(`UPPER(gender) = UPPER($${paramIndex})`);
      values.push(filters.gender);
      paramIndex++;
    }
  }

  if (filters.tier) {
    conditions.push(`COALESCE(tier, '3') = $${paramIndex}`);
    values.push(filters.tier);
    paramIndex++;
  }

  if (filters.category) {
    conditions.push(`gudang_category = $${paramIndex}`);
    values.push(filters.category);
    paramIndex++;
  }

  return {
    clause: "WHERE " + conditions.join("\n  AND "),
    values,
  };
}

/** Return the next param index after filters */
export function nextParamIndex(filters: FilterParams): number {
  let idx = 1;
  if (filters.branch) idx++;
  if (filters.gender && filters.gender !== "Baby & Kids") idx++;
  if (filters.tier) idx++;
  if (filters.category) idx++;
  return idx;
}
