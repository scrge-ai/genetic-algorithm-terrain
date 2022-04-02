const {Engine,Composite,Render,World,Bodies,Body,Detector,Constraint,Runner, Vector, Events, Common, Vertices} = Matter;

//Common.setDecomp(require('poly-decomp'));

class Bot{
	constructor(size){
		var params = {
			collisionFilter: { //allow bot to collide with itself (the engine breaks if we allow self-collisions lol)
				category: 2,
				group: -1,
				mask: 1
			},
			friction: 1,
			frictionAir: 0,
			restitution: 0.5, //bounciness
		}
		this.size = size;
		//just for creation, just use this.body.position to get live positioning
		
		this.x = 100;
		this.y = 100;

		//locations for each bone (also just for creation)
		this.bodyX = this.x;
		this.bodyY = this.y

		this.thighX = this.x;
		this.thighY = this.y+100*size;

		this.shinX = this.x;
		this.shinY = this.y+200*size;

		//bones
		this.body = Bodies.rectangle(this.bodyX, this.bodyY, 100*size, 100*size, params);
		this.thigh = Bodies.rectangle(this.thighX, this.thighY+100*size, 50*size, 100*size, params); 
		this.shin = Bodies.rectangle(this.thighX, this.thighY+200*size, 50*size, 100*size, params);

		//joints
		this.bodyToThigh = Constraint.create({
			bodyA: this.body,
			bodyB: this.thigh, 
			pointA: Matter.Vector.create(0, 50*size),
			pointB: Matter.Vector.create(0, -50*size),
			stiffness:1,
			length:0,
			damping:0.1,
			render:{
				anchors:false,
				lineWidth:0
			}
		});

		this.thighToShin = Constraint.create({
			bodyA: this.thigh,
			bodyB: this.shin, 
			pointA: Vector.create(0,50*size),
			pointB: Vector.create(0,-50*size),
			stiffness:1,
			length:0,
			damping:0.1,
			render:{
				anchors:false,
				lineWidth:0
			}
		});

		//ML
		this.model = tf.sequential();
		
		this.model.add(tf.layers.dense({ //no hidden layers
			units: 2, //rotation of thigh, rotation of shin
			activation: 'tanh',
			inputDim: 4 //x velocity, y velocity, thigh angle, shin angle
		}));
	}

	//TODO; this doesn't work yet idk why
	getParts(){
		console.log("getting parts");
		return [
			this.body,
			this.thigh,
			this.shin,
			this.bodyToThigh,
			this.thighToShin
		];
	}

	//not using this, just use default matterjs render engine
	draw(color){
		appearRect(this.body.vertices, color);
		appearRect(this.thigh.vertices, color);
		appearRect(this.shin.vertices, color);
	}

	action(doActions){
		//we need to truncate the input to somewhere between -1 and 1, which is why we take cosine of the angles and normalise the velocity, etc.
		
		var velocity = Vector.create(this.body.velocity.x, this.body.velocity.y); //make a copy of velocity vector
		Vector.normalise(velocity); //this makes it so that the vector only shows the direction
		
		var input = tf.tensor([[velocity.x, velocity.y, Math.cos(this.thigh.angle), Math.cos(this.shin.angle)]]);
		//input.print();
		var action = this.model.predict(input); //get model prediction of the best action

		var action_array = action.arraySync()[0]; // turn action (a tf.tensor) into an array

		//do actions
		if(doActions){ //doActions tells us whether to do the predicted actions immediately or just return them
			Body.setAngularVelocity(this.thigh, action_array[0]);
			Body.setAngularVelocity(this.shin, action_array[1]);
		}
		//console.log(action_array);
		return action_array[0];
	}

	makeChild(mutationAmount){
		//console.log(this.model.getWeights());
		var mutation = tf.randomUniform(this.model.getWeights()[0].shape, -mutationAmount, mutationAmount); //mutations in the shape of model weights, with random minimum -mutationAmount and maximum mutationAmount
		var mutation_bias = tf.randomUniform(this.model.getWeights()[1].shape, -mutationAmount, mutationAmount); //mutation for bias of neural network
		
		//console.log(mutation);
		var newWeights = this.model.getWeights()[0].add(mutation); // weights of child
		//console.log(newWeights);
		var newBias = this.model.getWeights()[1].add(mutation_bias); //bias of child
		var newModel = tf.sequential();

		//console.log(newModel);
		
		newModel.add(tf.layers.dense({ //no hidden layers
			units: 2, //rotation of thigh, rotation of shin
			activation: 'tanh',
			inputDim: 4 //x velocity, y velocity, thigh angle, shin angle
		}));

		newModel.setWeights([newWeights, newBias]);
		//console.log(newModel)

		return newModel;
	}
}

//not using this
function appearRect(verts,col){
	ctx.fillStyle = col;
	ctx.beginPath();
	ctx.moveTo(verts[0].x, verts[0].y)// go to the first vertex
	for (var i = 1; i < verts.length; i++) {
		ctx.lineTo(verts[i].x, verts[i].y); // draw each of the next verticies
	}
	ctx.lineTo(verts[0].x, verts[0].y); //go back to the first one
	ctx.fill(); // fill it
	ctx.stroke(); // add a border
}
