# Qlik Sense Dev tool
Developer tool extension for Qlik Sense

##Allows the user to display id, type, handle and properties for visualizations.
When you press the 'Toggle Id' button it will add labels with id and type to all visualizations on the sheet. 
This can be useful if you for example are creating a mashup and need the object ids.

###News in Version 2

1. Floating action button
The button is now a FAB button, which will remain on screen until you refresh the page, even if you change sheet.
This means you can use it on a published sheet:
  * create a new sheet
  * add the devtool extension, the button will appear
  * change to the (possibly published) sheet where you need it
  * click the FAB

2. Button to show properties
The labels now also contain a button to show properties for the visualization.

![](devtool.png)

In the future I intend to add more functions to this tool. If you have any ideas, 
please post them, or clone the repository, add it and make a pull request.

Note: this function uses css class names to find the visualizations, angular scope() function to find the 
corresponding scope and lastly some scope navigation to find the data. This works right now, but might
break any time.
