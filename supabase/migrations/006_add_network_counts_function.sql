-- Add a function to efficiently get network counts
-- This avoids fetching all endpoints just to count by network

CREATE OR REPLACE FUNCTION get_network_counts()
RETURNS TABLE (network TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(e.network, 'unknown') as network,
    COUNT(*)::BIGINT as count
  FROM endpoints e
  WHERE e.is_active = true
  GROUP BY e.network
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION get_network_counts() TO anon, authenticated;
