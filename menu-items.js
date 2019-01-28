const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//check if specifed menu item exists
menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  db.get("SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId", {
    $menuItemId: menuItemId
  }, (err, menuItem) => {
    if (err) {
      next(err);
    } else if (menuItem) {
      req.menuItem = menuItem;
      next();
    } else {
      res.sendStatus(404);
    }
  })
});

//return all menu items from database
menuItemsRouter.get('/', (req, res, next) => {
  db.all("SELECT * FROM MenuItem WHERE MenuItem.menu_id = $id", {$id: req.params.id}, (error, menuItems) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({menuItems: menuItems});
    }
  })
});

//create new menu item
menuItemsRouter.post('/', (req, res, next) => {
  const name = req.body.menuItem.name;
  const description = req.body.menuItem.description;
  const inventory = req.body.menuItem.inventory;
  const price = req.body.menuItem.price;
  const menuId = req.body.menuItem.menu_id;
  const menuSql = "SELECT * FROM Menu WHERE Menu.id = $menuId";
  const menuValues = {$menuId: menuId}
  db.get(menuSql, menuValues, (error, menu) => {
    if (error) {
      next(error);
    } else {
      if (!name || !description || !inventory || !price || !menu) {
        return res.sendStatus(400);
      }
      const sql = "INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menuId)";
      const values = {
        $name: name,
        $description: description,
        $inventory: inventory,
        $price: price,
        $menuId: menuId
      }
      db.run(sql, values, (error) => {
        if (error) {
          next(error);
        } else {
          db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`, (error, newItem) => {
            res.status(201).json({menuItem: newItem});
          })
        }
      })
    }
  })
});

//update menu item with specified id
menuItemsRouter.put('/:menuItemId', (req, res, next) => {
   const name = req.body.menuItem.name;
   const description = req.body.menuItem.description;
   const inventory = req.body.menuItem.inventory;
   const price = req.body.menuItem.price;
   const menuId = req.body.menuItem.menu_id;
   const menuSql = "SELECT * FROM Menu WHERE Menu.id = $menuId";
   const menuValues = {$menuId: menuId};
   db.get(menuSql, menuValues, (error, menu) => {
     if (error) {
       next(error);
     } else {
       if (!name || !description || !inventory || !price || !menu) {
         return res.sendStatus(400);
       }
       const updateSql = "UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menuId = $menuId WHERE MenuItem.id = $menuItemId";
       const updateValues = {
         $name: name,
         $description: description,
         $inventory: inventory,
         $price: price,
         $menuId: menuId,
         $menuItemId: req.params.menuItemId
       };
       db.run(updateSql, updateValues, (error) => {
         if (error) {
           next(error);
         } else {
           db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${req.params.menuItemId}`, (error, menuItem) => {
             res.status(200).json({menuItem: menuItem});
           })
         }
       })
     }

   })
});

//delete menu item with specified id
menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
  db.run("DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId", {
    $menuItemId: req.params.menuItemId
  }, (error) => {
    if (error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  })
});

module.exports = menuItemsRouter;
