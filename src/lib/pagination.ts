export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(Number(searchParams.get("page") || "1"), 1);
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE)), 1),
    MAX_PAGE_SIZE
  );

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function buildPagination({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
