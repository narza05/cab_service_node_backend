import pool from "../config/db.js"

const createUser = async (req, res) => {
    const { mobile, name, type } = req;

    if (!name || !mobile || !type) {
        return res.status(400).json({ error: 'Name and mobile are required.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO users (name, mobile, type) VALUES ($1, $2, $3) RETURNING *',
            [name, mobile, type]
        );

        res.status(201).json({
            message: 'User created successfully.',
            user: result.rows[0],
        });
    } catch (err) {
        console.error('Error inserting user:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }

};

const updateDriverStatus = async (req, res) => {
    const { user_id, status } = req;
    try {
        const result = await pool.query("INSERT INTO driver_status (user_id, status) VALUES ($1, $2) RETURNING *", [user_id, status])

        res.status(201).json({
            message: 'Status updated successfully',
            user: result.rows[0]
        })

    } catch (err) {
        console.error('Error inserting user:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }

}

export default { createUser, updateDriverStatus }