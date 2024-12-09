import locationModel from "../models/locationModel.js";

const updateDriverLocation = async (req, res) => {
    try {
        console.log('Received data:', req.body);
        const { driver_id, lat, lng, status } = req.body;
        await locationModel.updateDriverLocation({ driver_id, lat, lng, status });
        res.status(201).json({
            message: 'Location updated successfully.',
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
}

export default { updateDriverLocation }