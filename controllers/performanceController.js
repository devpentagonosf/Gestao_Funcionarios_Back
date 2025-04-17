export const getEmployees = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [employees] = await connection.execute('SELECT * FROM employees');
    connection.release();

    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPerformance = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [performance] = await connection.execute(`
      SELECT 
        e.id,
        e.name,
        e.position,
        p.productivity,
        p.goals_achieved as goals,
        p.hours_worked,
        p.rating
      FROM employees e
      JOIN performance p ON e.id = p.employee_id
    `);
    connection.release();

    res.json(performance);
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
