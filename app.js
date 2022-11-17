//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


//Database Cloud
const database = module.export = () =>{
  const connectionParams = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
  try{
    mongoose.connect("mongodb+srv://mimo:Z7OS6khMkG5suD6b@cluster0.h92lk4g.mongodb.net/mongodb?retryWrites=true&w=majority")
    console.log("Connection to MongoDB was successfully established");
  }catch (error){
    console.log("Error no connection to DB")
  }
}



const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "add tasks",
})

const item2 = new Item({
  name: "like cooking",
})

const item3 = new Item({
  name: "or sleeping",
})



//unsere default itmes Sammlung 
const defaultItems = [item1, item2, item3]
const listSchema = {
  name: String, 
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)

//Renderted alle items die zur normalen Liste gehören inkl. aktuellen Tag. 
//app.get soll eine bestimmte Route abgleichen udn verarbeiten. 
//Das Dokument wird angefordert
app.get("/", function(req, res) {

  //So wird alles innerhalb der item Sammlung gefunden um 
  //es anschließend zu rendern. foundItems beinhaltet alles was 
  // in Item gefunden wurde. 
  Item.find({}, function (err, foundItems){
    
    if (foundItems.length === 0){
      //Sendet alle defaultitems zu unserer Sammlung Item
      Item.insertMany(defaultItems, function (err){
        if(err){
          console.log("Error");
        } else {
          console.log("Items inserted to DB");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })
});

app.get("/:customListName", function(req, res,){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        //Go to existing list 
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  })
});
//app.post liefert ein HTTP Post und seine Nutzlast. 
//Wird verwendet um das Dokument zus enden. Dem Server wird 
//mitgeteilt, was auf diese Methoden auf bestimmte Routen zu antworten ist.  
app.post("/", function(req, res){
//wenn neue items in der app.js hingzugefügt werden, werden
//sie in die relevanten jeweiligen Arrays gepushed
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
  name: itemName
  })
  if (listName === "Today"){
  item.save();
  res.redirect("/");
  } else {
  List.findOne({name:listName}, function(err, foundList){
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + listName);
  })
  }
});

app.post("/delete", function(req, res){
   const checkedItemId = req.body.checkbox;
   const listName = req.body.listName;

   if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err){
        console.log("Successfully deleted");
        res.redirect("/");
      }
    });
  } else {
  List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
    if(!err){
      res.redirect("/" + listName);
    }
  });
}
});

//Renderted die About Seite ==> Hat aber keine items
app.get("/about", function(req, res){
  res.render("about");
});


database(),

app.listen(2000, function() {
  console.log("Server started on port 2000");
});


