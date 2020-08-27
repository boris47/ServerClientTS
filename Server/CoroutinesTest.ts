import {Coroutines, AsyncCoroutines} from '../Common/Coroutine';

let generatorsDone = false;

// Generators (ES6)
{
	function* WaitNTimesCO()
	{
		for(let index = 1; index < 5; index ++) yield new Coroutines.WaitForMilliseconds(200);
	}
	function* WaitAndReturnFuncCO()
	{
		for(let index = 4; index < 9; index ++) yield new Coroutines.WaitForMilliseconds(500);
		return () => (console.log("RITORNO AL FUTURO"), true);
	}
	function* WaitAndReturnPromiseNoValue()
	{
		yield new Coroutines.WaitForMilliseconds(500);
		return new Promise<void>( resolve => setTimeout(resolve, 3000) );
	}
	function* WaitAndReturnPromiseValue()
	{
		yield new Coroutines.WaitForMilliseconds(500);
		return new Promise<number>( resolve => setTimeout(() => resolve(5), 3000) );
	}
	function* FirstCO()
	{
		{	// yield WaitUntil Instruction
			let bCanContinue = false;
			setTimeout(() => bCanContinue = true, 1750);
			yield new Coroutines.WaitUntil( () => bCanContinue );
			console.log('WaitUntil', 'DONE');
		}
		{	// yield for given milliseconds
			yield new Coroutines.WaitForMilliseconds(1000);
			console.log('WaitForMilliseconds', 'DONE');
		}
		{	// yield another coroutine ( WITH PROMISED RETURN BUT NO VALUE )
			const waitCoroutine = Coroutines.StartCoroutine( WaitAndReturnPromiseNoValue() );
			yield new Coroutines.WaitUntil( () => waitCoroutine.IsCompleted );
			console.log('WaitAndReturnPromiseNoValue', 'DONE');
		}
		{	// yield another coroutine ( WITH PROMISED RETURN OF VALUE )
			const returnedValue = yield Coroutines.StartCoroutine(WaitAndReturnPromiseValue());
			console.log('WaitAndReturnPromiseValue', 'DONE', returnedValue);
		}
		{	// yield another coroutine ( NO RETURN )
			yield Coroutines.StartCoroutine(WaitNTimesCO());
			console.log('WaitNTimesCO', 'DONE');
		}
		{	// yield another coroutine ( WITH RETURN )
			const returnedValue = yield Coroutines.StartCoroutine(WaitAndReturnFuncCO());
			console.log('coroutine2 WaitAndReturnFuncCO', returnedValue);
		}
		generatorsDone = true;
	}
	console.log("Generators")
	Coroutines.StartCoroutine(FirstCO());
}

// ASYNC/AWAIT (ES7)
{
	async function WaitNTimesCO()
	{
		for(let index = 1; index < 5; index ++) await AsyncCoroutines.WaitForMilliseconds(200);
	}
	async function WaitAndReturnFuncCO()
	{
		for(let index = 4; index < 9; index ++) await AsyncCoroutines.WaitForMilliseconds(500);
		return () => (console.log("RITORNO AL FUTURO"), true);
	}
	async function WaitAndReturnPromiseNoValue()
	{
		await AsyncCoroutines.WaitForMilliseconds(3000);
	}
	async function WaitAndReturnPromiseValue()
	{
		await AsyncCoroutines.WaitForMilliseconds(500);
		return new Promise<number>( resolve => setTimeout(() => resolve(5), 3000) );
	}
	async function SecondCO()
	{
		await AsyncCoroutines.WaitUntil(() => generatorsDone); console.log('\n\nAsync/Await Model');
		{	// yield WaitUntil Instruction
			let bCanContinue = false;
			setTimeout(() => bCanContinue = true, 1750);
			await AsyncCoroutines.WaitUntil( () => bCanContinue );
			console.log('WaitUntil', 'DONE');
		}
		{	// yield for given milliseconds
			await AsyncCoroutines.WaitForMilliseconds(1000);
			console.log('WaitForMilliseconds', 'DONE');
		}
		{	// yield another coroutine ( WITH PROMISED RETURN BUT NO VALUE )
			await AsyncCoroutines.StartCoroutine( WaitAndReturnPromiseNoValue() );
			console.log('WaitAndReturnPromiseNoValue', 'DONE');
		}
		{	// yield another coroutine ( WITH PROMISED RETURN OF VALUE )
			const returnedValue = await AsyncCoroutines.StartCoroutine(WaitAndReturnPromiseValue());
			console.log('WaitAndReturnPromiseValue', 'DONE', returnedValue);
		}
		{	// yield another coroutine ( NO RETURN )
			await AsyncCoroutines.StartCoroutine(WaitNTimesCO());
			console.log('WaitNTimesCO', 'DONE');
		}
		{	// yield another coroutine ( WITH RETURN )
			const returnedValue = await AsyncCoroutines.StartCoroutine(WaitAndReturnFuncCO());
			console.log('coroutine2 WaitAndReturnFuncCO', returnedValue);
		}
	}
	SecondCO();
}