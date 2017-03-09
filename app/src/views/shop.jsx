import React from 'react';
import {render} from 'react-dom';
import {Navbar,NavItem,Icon} from 'react-materialize';

import { Row, Col, Card, CardTitle, Button } from 'react-materialize';

import { inventory, Item } from 'services/inventory';
import { orderService } from 'services/order';
import { http } from 'services/net';

import { ClickProxy, CheckoutModal } from 'components/modals.jsx';

import { Subject } from 'rxjs';

class Stack{
  constructor(item,qty){
    this._item = item;
    this._qty = qty;
  }

  inc(){
    this._qty = this._qty + 1;
  }

  get item(){
    return this._item;
  }

  canStack(item){
    return this.item == item;
  }

  get qty(){
    return this._qty;
  }

  get cost(){
    return this.qty * this.item.price;
  }

  get checkoutObject(){
    return {
      object_id: this.item.id,
      quantity: this.qty
    };
  }
}

export class ShopView extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      inventory: [],
      shoppingCart: []
    };
    this.shopSubmit = new Subject();
  }

  get shoppingCart(){
    return this.state.shoppingCart;
  }

  set shoppingCart(a){
    this.setState(Object.assign(this.state,{
      shoppingCart: a
    }));
  }
  
  get subtotal(){
    let total = 0;
    for(let stack of this.shoppingCart){
      total += stack.cost;
    }
    return total;
  }

  componentDidMount(){
    inventory.getInventory().subscribe((inv)=>{
      this.setState(Object.assign(this.state,{
        inventory: inv
      }));
    });
  }

  addToCart(item){
    let existingStack = false;
    for(let stack of this.shoppingCart){
      if(stack.canStack(item)){
        stack.inc();
        existingStack = true;
        break;
      }
    }

    if(!existingStack){
      this.shoppingCart.push(new Stack(item,1));
    }

    this.forceUpdate();
  }

  clearCart(stack){
    this.shoppingCart = this.shoppingCart.filter(a => a!=stack);
  }

  cartCheckout(){
    //Open modals
    this.shopSubmit.next("a");
    let orders = [];
    for(let o of this.shoppingCart) {
      orders.push(o.checkoutObject);
    }
    /*orderService.checkoutOrder(this.props.user,orders).subscribe(v => {
      this.clearCart();
      //Fetch user again?
    });*/
    this.clearCart();
  }
  
  
  render () {
    let checkoutModal = 
      <CheckoutModal 
        orders={this.shoppingCart} 
        trigger={<ClickProxy proxy={this.shopSubmit.asObservable()} />} 
        status="await"
      />
    

    let inv = [];
    let k = 0;
    for(let item of this.state.inventory){
      let img = item.image;
      inv.push(
        <Col s={4} key={k++}>
          <Card 
            onClick={()=>this.addToCart(item)}
            className="small hoverable clickable item"
            title={ item.name }
            textClassName="grey-text text-darken-4 truncate"
            header={
              <CardTitle 
                image={img ? img.thumb : ""}
                waves="light"
              ></CardTitle>
            }
            actions={[
              <a 
                key={0}
                className="add waves-effect waves-blue btn btn-flat nibble-color lighter left-align"
              >
                Legg til
              </a>
            ]}
          > 
            <p className="thin truncate item-description">
              {item.description}
            </p>
            <span className="item-count">
              { item.price }kr 
            </span>
          </Card>
        </Col>
      );
    }
    
    let cartContents = [];
    k = 0;
    for(let stack of this.shoppingCart){
      cartContents.push(
        <tr className="item_box" key={k++}> 
          <td>
            <span className="item_name">
              { stack.item.name }
            </span> 
            
            <Button floating large className="right remove waves-red" onClick={() => this.clearCart(stack)} icon="clear" waves="light" />
            <a className="item-quantity right">
              { stack.qty } x { stack.item.price },-
            </a>
          </td>
        </tr>
      );
    }


    return (
      <Row>
        <Col m={9} l={9}>
          {inv}
        </Col>
        <Col m={3} l={3} className="side-nav fixed side-nav-custom">
          <table>
            <tbody>
              { cartContents }
            </tbody>
          </table>
          <div className="checkout">
            <div className="sum">Subtotal: <span className="right">{ this.subtotal },-</span></div>
            <div>
              <h5>
                <span>Balanse etter handel: <span className="right">{ this.props.user.saldo - this.subtotal },-</span></span>
              </h5>
            </div>
            <Button onClick={() => this.cartCheckout()} disabled={( (this.props.user.saldo - this.subtotal) < 0) || (this.shoppingCart.length <= 0) } className="buy waves-effect waves-light nibble-color success" large>Kjøp</Button>
          </div>
        </Col>
        {checkoutModal}
      </Row>
    );
  }
}
