/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

	static async getCustomersByName(last_name) {

			const results = await db.query(
				`SELECT id,
				first_name AS "firstName",
				last_name AS "lastName",
				phone,
				notes
				FROM customers
				WHERE last_name ILIKE $1`,
				[`%${last_name}%`]
			);
	
			if(results.rows.length === 0) {
				const err = new Error(`Could not find customer based on that search`)
				err.status = 404
				throw err
			} else {
				return results.rows.map(c => new Customer(c))
			}

	}

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

	static async getTopTenCustomers() {

		const results = await db.query(`
			SELECT customers.id AS "id", customers.first_name AS "firstName", customers.last_name AS "lastName", customers.phone as "phone", customers.notes AS "notes", COUNT(reservations.id) as num_of_reservations
			FROM customers
			LEFT JOIN reservations ON customers.id = reservations.customer_id
			GROUP BY customers.id
			ORDER BY num_of_reservations DESC
			LIMIT 10
			`);

			if(results.rows.length === 0) {
				console.log(results.rows)
				const err = new Error(`Looks like something went wrong with the request or no customers have reservations`)
				err.status = 404
				return err
			} else {
				return results.rows.map(customer => {
					return new Customer(customer)
				})
			}
	}

	getFullName() {
		return this.firstName + ' ' + this.lastName
	}

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }
}

module.exports = Customer;
