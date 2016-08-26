# B
A ES6 proxy based data binding library

** This is a work in progress **

I started working on this to try and build a data binding library using the power of proxies.
It's still in early development and has many improvements to be done.

## Basic Usage

* Currently you need to specify the listing events directly in the **events** property in the library.
* Once the event is defined you can use b-'events_name' on html elements to add the name of the listener function.
* Each attribute value used the **dot notation** format (obj.subobj.property)
* Custom function call with parameters is not supported at the moment (it is planned)
* **b-model** can be used on input or html element with content to bind a variable value
* **b-for** can be used to create a loop of elements. The format used is "var in obj.list".
 

## Contributing

Check out the [Contributing Guidelines](CONTRIBUTING.md)

## Authors

* [Maxime Myers](https://github.com/maxetime)
