/**
 * Entidade de Registro de Abastecimento.
 */
class FuelRecord {
    /**
     * @param {Object} record
     * @param {string} [record.id]
     * @param {string} record.vehicle_id
     * @param {string} [record.driver_id]
     * @param {string} record.fuel_type
     * @param {number} record.liters
     * @param {number} record.price_per_liter
     * @param {number} record.total_cost
     * @param {number} record.odometer
     * @param {string} [record.station_name]
     * @param {string} [record.location]
     * @param {Date} [record.fill_date]
     */
    constructor({ id, vehicle_id, driver_id, fuel_type, liters, price_per_liter, total_cost, odometer, station_name, location, fill_date }) {
        this.id = id;
        this.vehicle_id = vehicle_id;
        this.driver_id = driver_id;
        this.fuel_type = fuel_type;
        this.liters = liters;
        this.price_per_liter = price_per_liter;
        this.total_cost = total_cost;
        this.odometer = odometer;
        this.station_name = station_name;
        this.location = location;
        this.fill_date = fill_date || new Date();
    }
}

module.exports = FuelRecord;
