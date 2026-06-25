export const getHealth = (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    dbError: global.dbError || null
  });
};
