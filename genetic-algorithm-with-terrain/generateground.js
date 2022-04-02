var bumpFrequency = 100
var bumpAmount = 50; //how dramatic are the bumps
var groundX = 400;
var groundY = 600;

Common.setDecomp(require('poly-decomp'));

function generateGround(){ //generate terrain
	var body = Body.create(400, 500, []);
	var verticesArray = [];

	verticesArray.push(Vector.create(0, 100));
	
	for(var x = 0; x <= 800; x += bumpFrequency){
		//console.log(x);
		var vert = Vector.create(x, Math.floor(Math.random() * bumpAmount*2)-bumpAmount);
		verticesArray.push(vert);
	}

	//console.log(verticesArray);
	verticesArray.push(Vector.create(800, 100));
	
	verticesArray.push(Vector.create(800, bumpAmount));
	
	var vertices = Vertices.create(verticesArray, body);

	//console.log(vertices);
	console.log(verticesArray);
	//return Body.create({position: Vector.create(600, 500), isStatic:true, vertices:vertices});
	return Bodies.fromVertices(400, 600, vertices,{isStatic:true});
}