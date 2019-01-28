const express = require('express');
const menusRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuItemsRouter = require('./menu-items.js');

//parameter to check specified menu id exists
menusRouter.param('id', (req, res, next, id) => {
  db.get("SELECT * FROM Menu WHERE Menu.id = $id", {
    $id: id
  }, (error, menu) => {
    if (error) {
      next(error);
    } else if (menu) {
      req.menu = menu;
      next();
    } else {
      res.sendStatus(404);
    }
  })
});

menusRouter.use('/:id/menu-items', menuItemsRouter);

//return all menus
menusRouter.get('/', (req, res, next) => {
  db.all("SELECT * FROM Menu", (err, menus) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({menus: menus});
    }
  })
});

//get menu with specified id
menusRouter.get('/:id', (req, res, next) => {
  res.status(200).json({menu: req.menu})
});

menusRouter.post('/', (req, res, next) => {
  const menuTitle = req.body.menu.title;
  if (!menuTitle) {
    res.sendStatus(400);
  }
  db.run("INSERT INTO Menu (title) VALUES ($title)", {
    $title: menuTitle
  }, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`, (error, menu) => {
        res.status(201).json({menu: menu});
      })
    }
  })
});

//update menu with specified id
menusRouter.put('/:id', (req, res, next) => {
  const title = req.body.menu.title;
  if (!title) {
    res.sendStatus(400);
  }
  db.run("UPDATE Menu SET title = $title WHERE Menu.id = $id", {
    $title: title,
    $id: req.params.id
  }, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.id}`, (error, menu) => {
        res.status(200).json({menu: menu});
      })
    }
  })
});

//deletes menu with specified id
menusRouter.delete('/:id', (req, res, next) => {
  const itemSql = "SELECT * FROM MenuItem WHERE MenuItem.menu_id = $id";
  const itemValues = {$id: req.params.id};
  db.get(itemSql, itemValues, (error, menuItem) => {
    if (error) {
      next(error);
    } else if (menuItem) {
      res.sendStatus(400);
    } else {
      const removeSql = "DELETE FROM Menu WHERE Menu.id = $id";
      const removeValues = {$id: req.params.id};
      db.run(removeSql, removeValues, (error) => {
        if (error) {
          next(error);
        } else {
          res.sendStatus(204);
        }
      })
    }
  })
});

module.exports = menusRouter;
