const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//parameter to check if specified timesheet exists
timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = "SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId";
  const values = {$timesheetId: timesheetId};
  db.get(sql, values, (err, timesheet) => {
    if (err) {
      next(err);
    } else if (timesheet) {
      req.timesheet = timesheet;
      next();
    } else {
      res.sendStatus(404);
    }
  })
});

//return all timesheets in database related to employee with specified id
timesheetsRouter.get('/', (req, res, next) => {
  db.all("SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId", {
    $employeeId: req.params.employeeId
  }, (error, timesheets) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({timesheets: timesheets});
    }
  })
});

//create new timesheet for employee with specified id
timesheetsRouter.post('/', (req, res, next) => {
  const hours = req.body.timesheet.hours;
  const rate = req.body.timesheet.rate;
  const date = req.body.timesheet.date;
  const employeeId = req.body.timesheet.employee_id;
  const employeeSql = "SELECT * FROM Employee where Employee.id = $employeeId";
  const employeeValues = {$employeeId: employeeId};
  db.get(employeeSql, employeeValues, (error, employee) => {
    if (error) {
      next(error);
    } else {
      if (!hours || !rate || !date || !employee) {
      return res.sendStatus(400);
    }
    const timesheetSql = "INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)";
    const timesheetValues = {
      $hours: hours,
      $rate: rate,
      $date:  date,
      $employeeId: employeeId
    };
    db.run(timesheetSql, timesheetValues, (error) => {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`, (error, newTimesheet) => {
          res.status(201).json({timesheet: newTimesheet});
        })
      }
    })
  }
  })
});

//update timesheet with specified timesheet id
timesheetsRouter.put('/:timesheetId', (req, res, next) => {
  const hours = req.body.timesheet.hours;
  const rate = req.body.timesheet.rate;
  const date = req.body.timesheet.date;
  const employeeId = req.body.timesheet.employee_id;
  const employeeSql = "SELECT * FROM Employee WHERE Employee.id = $employeeId";
  const employeeValues = {$employeeId: employeeId};
  db.get(employeeSql, employeeValues, (error, employee) => {
    if (error) {
      next(error);
    } else {
      if (!hours || !rate || !date || !employee) {
      return res.sendStatus(400);
    }
    const updateSql = "UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeId WHERE Timesheet.id = $timesheetId";
    const updateValues = {
      $hours: hours,
      $rate: rate,
      $date: date,
      $employeeId: employeeId,
      $timesheetId: req.params.timesheetId
    }
    db.run(updateSql, updateValues, (error) => {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`, (error, updatedTimesheet) => {
            res.status(200).json({timesheet: updatedTimesheet});
        })
      }
    })
  }
  })
});

//delete specified timesheet
timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  const deleteSql = "DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId";
  const deleteValues = {$timesheetId: req.params.timesheetId};
  db.run(deleteSql, deleteValues, (error) => {
    if (error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  })
});

module.exports = timesheetsRouter;
