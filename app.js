//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// connect mongoose

mongoose.connect("mongodb+srv://annabelleshq:zzzxshq971001@cluster0.jyonr.mongodb.net/todolistDB");

//mongoose schema
const itemSchema = {
  name: String
};

//mongoose model

const Item = mongoose.model("Item", itemSchema);

// mongoose default item

const item1 = new Item({
  name: "Welcome to your to do list"
});
const item2 = new Item({
  name: "Hit a plus button to add a new item"
});
const item3 = new Item({
  name: "Hit <-- this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
}
const List = mongoose.model("List", listSchema)



app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      //insert item in the item model when no items in collection
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully save the items in database");
        }
      });
      res.redirect("/")
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }

  });


});

app.post("/", function(req, res) {

  //the text from the html store in itenName
  const itemName = req.body.newItem;
  //the listName
  const listName = req.body.list;
  //create a mongoDB item
  const item = new Item({
    name: itemName
  });
  //if user stop in here
  if (listName === "Today") {
    //save the item in db
    item.save(function(err) {
      res.redirect("/");
    });
  } else {
    //the new list item comes from a custom list
    List.findOne({ //find by list name
      name: listName
    }, function(err, foundList) {
      //if found, then push the list to the items collection
      foundList.items.push(item);
      foundList.save(function() {
        res.redirect("/" + listName)
      });

    });
  }


});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    //must have callback to execute the deletion
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Successfully deleted item.");
        res.redirect("/")
      }
    });
  } else {
    //delete request from the custome list
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    })
  }


});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //create a list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save(function(err) {
          res.redirect("/" + customListName);
        });

      } else {
        //show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

// app.get("/work", function(req, res) {
//   res.render("list", {
//     listTitle: "Work List",
//     newListItems: workItems
//   });
// });

app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
// if port == null || port == "") {
//   port = 3000;
// }
app.listen(port || 3000, function() {
  console.log("Server has started Successfully on dynamic port ");
});