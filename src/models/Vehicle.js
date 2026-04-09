/**
 * Entidade Veículo.
 */
class Vehicle {
    /**
     * @param {Object} vehicle
     * @param {string} [vehicle.id]
     * @param {string} vehicle.owner_id
     * @param {string} vehicle.plate
     * @param {string} vehicle.model
     * @param {string} vehicle.brand
     * @param {number} vehicle.year_fabrication
     * @param {number} vehicle.fuel_capacity
     * @param {string} vehicle.fuel_type
     * @param {string} [vehicle.status]
     */
    constructor({ id, owner_id, plate, model, brand, year_fabrication, fuel_capacity, fuel_type, status = 'active' }) {
        this.id = id;
        this.owner_id = owner_id;
        this.plate = plate;
        this.model = model;
        this.brand = brand;
        this.year_fabrication = year_fabrication;
        this.fuel_capacity = fuel_capacity;
        this.fuel_type = fuel_type;
        this.status = status;
    }
}

module.exports = Vehicle;
