# Qlik Sense Dev tool
Developer tool extension for Qlik Sense

##Allows the user to display id and type for visualizations.
When you press the 'Toggle Id' button it will add labels with id and type to all visualizations on the sheet. 
This can be useful if you for example are creating a mashup and need the object ids.

Note: this function uses css class names to find the visualizations, angular scope() function to find the 
corresponding scope and lastly some scope navigation to find the data. This works right now, but might
break any time.


![](devtool.png)

In the future I intend to add more functions to this tool. If you have any ideas, 
please post them, or clone the repository, add it and make a pull request.
