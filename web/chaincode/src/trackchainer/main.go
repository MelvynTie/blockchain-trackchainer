//**********************
//**********************
// JABIL Co.           *
// Trackchainer        *
// Author : Melvyn Tie *
//**********************
//**********************

// Chaincode for init, invoke and init ledger.
// Define the function
package main

/* Imports
 * 4 utility libraries for formatting, handling bytes, reading and writing JSON, and string manipulation
 * 2 specific Hyperledger Fabric specific libraries for Smart Contracts
 */
import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
)

var logger = shim.NewLogger("main")
 
// Define the Smart Contract structure
type SmartContract struct {
}

// Define the car structure, with 10 properties.  Structure tags are used by encoding/json library
type Laptop struct {
	SerialNo  	string `json:"sn"`
	Employer	string `json:"Employer"`
}

/*
 * The Init method is called when the Smart Contract "fabcar" is instantiated by the blockchain network
 * Best practice is to have any Ledger initialization in separate function -- see initLedger()
 */
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	laptops := []Laptop{
		Laptop{SerialNo: "123", Employer: "Tomoko"},
	}

	i := 0
	for i < len(laptops) {
		fmt.Println("i is ", i)
		laptopAsBytes, _  := json.Marshal(laptops[i])
		APIstub.PutState("LAPTOP"+strconv.Itoa(i), laptopAsBytes)
		fmt.Println("Added", laptops[i])
		i = i + 1
	}
	return shim.Success(nil)
}

/*
 * The Invoke method is called as a result of an application request to run the Smart Contract
 * The calling application program has also specified the particular smart contract function to be called, with arguments
 */
func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()
	// Route to the appropriate handler function to interact with the ledger appropriately
	if function == "" {
		return s.Init(APIstub)
	} else if function == "initLedger" {
		return s.initLedger(APIstub)
	} else if function == "show_laptops" {
		return s.show_laptops(APIstub)
	} else if function == "search_laptop" {
		return s.search_laptop(APIstub, args)
	} else if function == "create_laptop" {
		return s.create_laptop(APIstub, args)
	} else if function == "edit_laptop" {
		return s.edit_laptop(APIstub, args)
	}	else if function == "remove_laptop" {
		return s.remove_laptop(APIstub, args)
	} else if function == "get_laptop_history" {
		return s.get_laptop_history(APIstub, args)
	}

	return shim.Error("Invalid Smart Contract function name.")
}

// Initialise the initial ledger
func (s *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) sc.Response {
	laptops := []Laptop{
		Laptop{SerialNo: "123", Employer: "Tomoko"},
	}

	i := 0
	for i < len(laptops) {
		fmt.Println("i is ", i)
		laptopAsBytes, _  := json.Marshal(laptops[i])
		APIstub.PutState("LAPTOP"+strconv.Itoa(i), laptopAsBytes)
		fmt.Println("Added", laptops[i])
		i = i + 1
	}
	return shim.Success(nil)
}

// Send all laptops as JSON form
func (s *SmartContract) show_laptops(APIstub shim.ChaincodeStubInterface) sc.Response {

	// Return every state
	//startKey := "LAPTOP0"
	//endKey := "LAPTOP999"

	resultsIterator, err := APIstub.GetStateByRange("", "")
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- queryAllCars:\n%s\n", buffer.String())
	return shim.Success(buffer.Bytes())
}

// Insert the new JSON data into the blockchain
func (s *SmartContract) create_laptop(APIstub shim.ChaincodeStubInterface, args []string ) sc.Response {

	if len(args) !=1 {
		return shim.Error("Invalid argument count.")
	}

	input := struct {
		Id string `json:"id"`
		SerialNo string `json:"sn"`
		Employer string `json:"employer"`
	}{}

	err := json.Unmarshal([]byte(args[0]), &input)
	if err != nil {
		return shim.Error(err.Error())
	}

	existingBytes, err := APIstub.GetState(input.Id)
	if err != nil {
		return shim.Error("Failed to check if laptop exists: " + err.Error())
	}
	if existingBytes != nil && len(existingBytes) > 0 {
		return shim.Error("Laptop already exists: " + input.Id)
	}

	var laptop = Laptop{SerialNo: input.SerialNo, Employer: input.Employer}
																		
	laptopAsBytes, _ := json.Marshal(laptop)
	
	err = APIstub.PutState(input.Id, laptopAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}

// Same function with create but treated as the edit function
func (s *SmartContract) edit_laptop(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) !=1 {
		return shim.Error("Invalid argument count.")
	}

	input := struct {
		Id string `json:"id"`
		SerialNo string `json:"sn"`
		Employer string `json:"employer"`
	}{}

	err := json.Unmarshal([]byte(args[0]), &input)
	if err != nil{
		return shim.Error(err.Error())
	}

	laptopAsBytes, err := APIstub.GetState(input.Id)
	if err != nil {
		return shim.Error("Failed to retrieve laptop state: " + err.Error())
	}
	if laptopAsBytes == nil || len(laptopAsBytes) == 0 {
		return shim.Error("Laptop with ID " + input.Id + " does not exist")
	}

	laptop := Laptop{}

	json.Unmarshal(laptopAsBytes, &laptop)
	if laptop.SerialNo != input.SerialNo {
		return shim.Error("Error getting the laptop")
	}
	laptop.Employer = input.Employer

	laptopAsBytes, _ = json.Marshal(laptop)

	err = APIstub.PutState(input.Id, laptopAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}

// By input the key , return value of the key
func (s *SmartContract) search_laptop(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	
	if len(args) !=1 {
		return shim.Error("Invalid argument count.")
	}

	input := struct {
		Id string `json:"id"`
	}{}
	
	err := json.Unmarshal([]byte(args[0]), &input)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	dbLaptopBytes, err := APIstub.GetState(input.Id)
	if err != nil {
		return shim.Error("Failed to retrieve laptop state: " + err.Error())
	}
	if dbLaptopBytes == nil || len(dbLaptopBytes) == 0 {
		return shim.Error("Laptop with ID " + input.Id + " does not exist")
	}
	var dbLaptop Laptop
	
	err=json.Unmarshal(dbLaptopBytes,&dbLaptop)
	if err != nil {
	   return shim.Error("{\"Error\":\"Failed to decode JSON of: " +string(dbLaptopBytes)+ "\" to Laptop}")
	}
	
	return shim.Success(dbLaptopBytes)
}

// Remove the key value of parameter in the blockchain
func (s *SmartContract) remove_laptop(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) !=1 {
		return shim.Error("Invalid argument count.")
	}

	input := struct {
		Id string `json:"id"`
	}{}
	
	err := json.Unmarshal([]byte(args[0]), &input)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	delstate:= APIstub.DelState(input.Id)
	if delstate != nil {
		return shim.Error(delstate.Error())
	}
	
	return shim.Success(nil)
}

// Return the history of the key 
func (s *SmartContract) get_laptop_history(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) !=1 {
		return shim.Error("Invalid argument count.")
	}

	input := struct {
		Id string `json:"id"`
	}{}
	
	err := json.Unmarshal([]byte(args[0]), &input)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	it, historyErr:= APIstub.GetHistoryForKey(input.Id)
	if historyErr!=nil{
	   return shim.Error(historyErr.Error())
	}
	
	var result,_= getHistoryListResult(it)
	
	return shim.Success(result)
}

// Filtering the history to the readable list
func getHistoryListResult(resultsIterator shim.HistoryQueryIteratorInterface) ([]byte,error){

	defer resultsIterator.Close()
	// buffer is a JSON array containing QueryRecords
	var buffer bytes.Buffer
	buffer.WriteString("[")
 
	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
	   queryResponse, err := resultsIterator.Next()
	   if err != nil {
		  return nil, err
	   }
	   // Add a comma before array members, suppress it for the first array member
	   if bArrayMemberAlreadyWritten == true {
		  buffer.WriteString(",")
	   }
	   item,_:= json.Marshal( queryResponse)
	   buffer.Write(item)
	   bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")
	fmt.Printf("queryResult:\n%s\n", buffer.String())
	return buffer.Bytes(), nil
 }

// The main function is only relevant in unit test mode. Only included here for completeness.
func main() {

	logger.SetLevel(shim.LogInfo)

	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}
