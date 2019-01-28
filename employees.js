const express = require('express');
const employeesRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const timesheetsRouter = require('./timesheets.js');

//parameter to check employee with specifed employee id exists
employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  db.get("SELECT * FROM Employee WHERE Employee.id = $employeeId", {
    $employeeId: employeeId
  }, (error, employee) => {
    if (error) {
      next(error);
    } else if (employee) {
      req.employee = employee;
      next();
    } else {
      res.sendStatus(404);
    }
  })
});

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

//return all employed employees in database
employeesRouter.get('/', (req, res, next) => {
  db.all("SELECT * FROM Employee WHERE Employee.is_current_employee = 1", (err, employees) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({employees: employees})
    }
  })
});

//return employee with specified employee id
employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({employee: req.employee});
});

//create new employee
employeesRouter.post('/', (req, res, next) => {
  const name = req.body.employee.name;
  const position = req.body.employee.position;
  const wage = req.body.employee.wage;
  const isCurrentEmployee = req.body.employee.is_current_employee === 0 ? 0 : 1;
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }
  db.run("INSERT INTO Employee (name, position, wage, is_current_employee) VALUES ($name, $position, $wage, $is_current_employee)", {
    $name: name,
    $position: position,
    $wage: wage,
    $is_current_employee: isCurrentEmployee,
  }, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`, (error, employee) => {
        res.status(201).json({employee: employee});
      })
    }
  })
});

//update exisiting employee with specified id
employeesRouter.put('/:employeeId', (req, res, next) => {
  const name = req.body.employee.name;
  const position = req.body.employee.position;
  const wage = req.body.employee.wage;
  const isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }
  const sql = "UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentEmployee WHERE Employee.id = $employeeId";
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $isCurrentEmployee: isCurrentEmployee,
    $employeeId: req.params.employeeId
  }
  db.run(sql, values, (error) => {
    if (error) {
      next(error)
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`, (error, employee) => {
        res.status(200).json({employee: employee});
      })
    }
  })
})

//'delete' employee - make specified employee unemployed
employeesRouter.delete('/:employeeId', (req, res, next) => {
  const sql = "UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId";
  const values = {$employeeId: req.params.employeeId};
  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`, (error, employee) => {
        res.status(200).json({employee: employee});
      })
    }
  })
})

module.exports = employeesRouter;
