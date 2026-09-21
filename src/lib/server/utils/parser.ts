
type Connect<T, K extends string> = { [P in K]: T };
type TParseConnectOrDisconnectRelation<T, K extends string> =
  | { connect: Connect<T, K> }
  | { disconnect: Connect<T, K> };

export const parseUpdateRelation = <T, K extends string>(
  data: T | undefined | null,
  key: K
): TParseConnectOrDisconnectRelation<NonNullable<T>, K> | undefined => {
  if (data == undefined) {
    return undefined;
  }
  const action = data == undefined ? "disconnect" : "connect";
  const result = { [key]: data } as Connect<NonNullable<T>, K>;
  return { [action]: result } as TParseConnectOrDisconnectRelation<
    NonNullable<T>,
    K
  >;
};

export const parseContains = <T extends object>(data: T | undefined | null) => {
  if (!data) return undefined;
  const keys = Object.keys(data);
  const result: Record<string, { contains: string }> = {};
  for (const key of keys) {
    result[key] = { contains: data[key as keyof T] as string };
  }
  return result;
};
