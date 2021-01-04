import React,{Component} from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Alert} from 'react-native';
import db from '../config';
import firebase from 'firebase';
import MyHeader from '../components/MyHeader';
import { RFValue } from "react-native-responsive-fontsize";
import { SearchBar, ListItem, Input } from "react-native-elements";



export default class ExchangeScreen extends Component{
  constructor(){
    super();
    this.state ={
      userId : firebase.auth().currentUser.email,
      itemName:"",
      itemValue:"",
      itemDescription:"",
      IsExchangedRequestActive : "",
      requestedItemName: "",
      itemStatus:"",
      requestId:"",
      userDocId: '',
      docId :'',
      itemValue:'',
    }
  }

  createUniqueId(){
    return Math.random().toString(36).substring(7);
  }



  addRequest = async (itemName,itemDescription)=>{
    var userId = this.state.userId
    var randomRequestId = this.createUniqueId()
    db.collection('requested_items').add({
        "user_id": userId,
        "item_name":itemName,
        "item_value" : itemValue,
        "item_description":itemDescription,
        "request_id"  : randomRequestId,
        "item_status" : "received",
         "date"       : firebase.firestore.FieldValue.serverTimestamp()

    })

    await  this.getItemRequest()
    db.collection('users').where("email_id","==",userId).get()
    .then()
    .then((snapshot)=>{
      snapshot.forEach((doc)=>{
        db.collection('users').doc(doc.id).update({
      IsItemRequestActive: true
      })
    })
  })

   this.setState({
        itemName :'',
        itemDescription : ''
    })

    return Alert.alert( 
      'Item ready to exchange ',
    '',
    [
      {text : 'Ok',onPress:()=>{
      this.props.navigation.navigate('HomeScreen')
      }}
      ]
      );
  }

  receivedItems=(itemName)=>{
    var userId = this.state.userId
    var requestId = this.state.requestId
    db.collection('received_items').add({
        "user_id": userId,
        "item_name":itemName,
        "request_id"  : requestId,
        "itemStatus"  : "received",
  
    })
  }
  
   getIsExchangedRequestActive(){
    db.collection('users')
    .where('email_id','==',this.state.userId)
    .onSnapshot(querySnapshot => {
      querySnapshot.forEach(doc => {
        this.setState({
          IsExchangedRequestActive:doc.data().IsExchangedRequestActive,
          userDocId : doc.id
        })
      })
    })
  }
  
  
  getItemRequest =()=>{
    // getting the requested book
  var itemRequest=  db.collection('requested_items')
    .where('user_id','==',this.state.userId)
    .get()
    .then((snapshot)=>{
      snapshot.forEach((doc)=>{
        if(doc.data().item_status !== "received"){
          this.setState({
            requestId : doc.data().request_id,
            requestedItemName: doc.data().item_name,
            itemStatus:doc.data().item_status,
            docId     : doc.id
          })
        }
      })
  })}
  
  
  
  sendNotification=()=>{
    //to get the first name and last name
    db.collection('users').where('email_id','==',this.state.userId).get()
    .then((snapshot)=>{
      snapshot.forEach((doc)=>{
        var name = doc.data().first_name
        var lastName = doc.data().last_name
  
        // to get the donor id and book nam
        db.collection('all_notifications').where('request_id','==',this.state.requestId).get()
        .then((snapshot)=>{
          snapshot.forEach((doc) => {
            var donorId  = doc.data().donor_id
            var itemName =  doc.data().item_name
  
            //targert user id is the donor id to send notification to the user
            db.collection('all_notifications').add({
              "targeted_user_id" : donorId,
              "message" : name +" " + lastName + " received the item " + itemName ,
              "notification_status" : "unread",
              "item_name" : itemName
            })
          })
        })
      })
    })
  }
  
  componentDidMount(){
    this.getItemRequest()
    this.getIsExchangedRequestActive()
  
  }
  
  updateItemRequestStatus=()=>{
    //updating the book status after receiving the book
    db.collection('requested_items').doc(this.state.docId)
    .update({
      item_status : 'recieved'
    })
  
    //getting the  doc id to update the users doc
    db.collection('users').where('email_id','==',this.state.userId).get()
    .then((snapshot)=>{
      snapshot.forEach((doc) => {
        //updating the doc
        db.collection('users').doc(doc.id).update({
          IsExchangedRequestActive: false
        })
      })
    })
  
  
  }  


  render(){
    
      if(this.state.IsExchangedRequestActive === true){
        return(
  
          // Status screen
  
          <View style = {{flex:1,justifyContent:'center'}}>
            <View style={{borderColor:"orange",borderWidth:2,justifyContent:'center',alignItems:'center',padding:10,margin:10}}>
            <Text>Item Name</Text>
            <Text>{this.state.requestedItemName}</Text>
            </View>
            <View style={{borderColor:"orange",borderWidth:2,justifyContent:'center',alignItems:'center',padding:10,margin:10}}>
            <Text>Item Value</Text>
            <Text>{this.state.itemValue}</Text>
            </View>
            <View style={{borderColor:"orange",borderWidth:2,justifyContent:'center',alignItems:'center',padding:10,margin:10}}>
            <Text> Item Status </Text>
  
            <Text>{this.state.itemStatus}</Text>
            </View>
  
            <TouchableOpacity style={{borderWidth:1,borderColor:'orange',backgroundColor:"orange",width:300,alignSelf:'center',alignItems:'center',height:30,marginTop:30}}
            onPress={()=>{
              this.sendNotification()
              this.updateItemRequestStatus();
              this.receivedItems(this.state.requestedItemName)
            }}>
            <Text>I recieved the item</Text>
            </TouchableOpacity>
          </View>
        )
      }
      else
      {
      return(
        // Form screen
        <ScrollView>
        <View style={{ flex: 1 }}>
        <View style={{ flex: 0.1 }}>
          <MyHeader title="Request Item" navigation={this.props.navigation} />
        </View>
        <View style={{ flex: 0.9 }}>
          <View style={{ alignItems: "center" }}>
          <Input
            style={styles.formTextInput}
            label={"Item Name"}
            placeholder={"item name"}
            containerStyle={{ marginTop: RFValue(60) }}
            value={this.state.itemName}
          />
                <Input
                  style ={styles.formTextInput}
                  containerStyle={{ marginTop: RFValue(30) }}
                  label={"Item Value"}
                  placeholder={"enter price of item"}
                  onChangeText={(text)=>{
                      this.setState({
                          itemValue:text
                      });
                  }}
                  value={this.state.itemValue}
                />
               
              <Input
                style={styles.formTextInput}
                containerStyle={{ marginTop: RFValue(30) }}
                multiline
                numberOfLines={9}
                label={"Description"}
                placeholder={"Write description of an item"}
                onChangeText={(text) => {
                  this.setState({
                    itemDescription : text,
                  });
                }}
                value={this.state.itemDescription}
              />
              
                <TouchableOpacity
                style={[styles.button, { marginTop: RFValue(30) }]}
                onPress={() => {
                  this.addRequest(
                    this.state.itemName,
                    this.state.itemDescription
                  );
                }}
              >
                <Text
                  style={styles.requestbuttontxt}
                >
                  Request
                </Text>
              </TouchableOpacity>
            </View>
          )
        </View>
      </View>
      </ScrollView>
    );
  }
}
}
  

const styles = StyleSheet.create({
  keyBoardStyle: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  formTextInput: {
    width: "75%",
    height: RFValue(35),
    borderWidth: 1,
    padding: 10,
  },
  ImageView:{
    flex: 0.3,
    justifyContent: "center",
    alignItems: "center",
    marginTop:20
  },
  imageStyle:{
    height: RFValue(150),
    width: RFValue(150),
    alignSelf: "center",
    borderWidth: 5,
    borderRadius: RFValue(10),
  },
  bookstatus:{
    flex: 0.4,
    alignItems: "center",

  },
  requestedbookName:{
    fontSize: RFValue(30),
    fontWeight: "500",
    padding: RFValue(10),
    fontWeight: "bold",
    alignItems:'center',
    marginLeft:RFValue(60)
  },
  status:{
    fontSize: RFValue(20),
    marginTop: RFValue(30),
  },
  bookStatus:{
    fontSize: RFValue(30),
    fontWeight: "bold",
    marginTop: RFValue(10),
  },
  buttonView:{
    flex: 0.2,
    justifyContent: "center",
    alignItems: "center",
  },
  buttontxt:{
    fontSize: RFValue(18),
    fontWeight: "bold",
    color: "#fff",
  },
  touchableopacity:{
    alignItems: "center",
    backgroundColor: "#DDDDDD",
    padding: 10,
    width: "90%",
  },
  requestbuttontxt:{
    fontSize: RFValue(20),
    fontWeight: "bold",
    color: "#fff",
  },
  button: {
    width: "75%",
    height: RFValue(60),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: RFValue(50),
    backgroundColor: "#32867d",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
});
