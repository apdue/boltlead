-- Function to get column information for a table
CREATE OR REPLACE FUNCTION get_columns_info(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable boolean
) SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text,
    (c.is_nullable = 'YES')::boolean
  FROM 
    information_schema.columns c
  WHERE 
    c.table_name = get_columns_info.table_name
    AND c.table_schema = 'public';
END;
$$ LANGUAGE plpgsql;

-- Function to run arbitrary SQL (use with caution, only for migrations)
CREATE OR REPLACE FUNCTION run_sql(query text)
RETURNS void SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$ LANGUAGE plpgsql; 