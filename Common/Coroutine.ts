
import GenericUtils, { UniqueID } from './Utils/GenericUtils';
import { Interface } from 'readline';
import { resolve } from 'path';

export namespace Coroutines
{
	/**
	 * - T: type yielded
	 * - TReturn: returned type
	 * - TNext: I don't know
	 */
	/*
	export interface IIterator<T = unknown, TReturn = any, TNext = unknown> extends Iterator<T, TReturn, TNext>
	{
		next(...args: [] | [TNext]): IteratorResult<T, TReturn>;
		return(value: TReturn): IteratorResult<T, TReturn>;
		throw(e: any): IteratorResult<T, TReturn>;
		[Symbol.iterator](): IIterator<T, TReturn, TNext>;
	}
	*/

	///////   Yield Instructions Start   ///////

	/**  */
	export abstract class YieldInstruction
	{
		/** Value returned after yield this instruction */
		protected abstract get Value(): any;

		/** If return true instructions is completed, otherwise must be updated again */
		protected abstract Update(...args:any[]): boolean;
	}
	
	export class WaitForMilliseconds extends YieldInstruction
	{
		public readonly timeMS: number = 0.0;
		public readonly start: number = 0.0;
		
		protected get Value(): any
		{
			return null;
		}

		constructor(timeMS: number)
		{
			super();
			this.timeMS = timeMS || 0;
			this.start = Date.now();
		}

		//
		protected Update(): boolean
		{
			const delta = Date.now() - this.start;
			return delta > this.timeMS;
		}
	}

	export class WaitUntil extends YieldInstruction
	{
		private readonly predicate = () => true;

		protected get Value(): any
		{
			return null;
		}

		constructor(predicate: () => boolean)
		{
			super();
			this.predicate = predicate || this.predicate;
		}

		//
		protected Update(): boolean
		{
			return this.predicate();
		}
	}

	///////    Yield Instructions End    ///////

	type SyncGenerator<TReturn = any> = Generator<Coroutines.YieldInstruction | Coroutines.Coroutine, TReturn, unknown>
	type ASyncGenerator<TReturn = any> = AsyncGenerator<Coroutines.YieldInstruction | Coroutines.Coroutine, TReturn, unknown>

	export function StartCoroutine<TReturn = any>(coroutine: Generator<Coroutines.YieldInstruction | Coroutines.Coroutine, TReturn, unknown>): Coroutine<TReturn>
	{
		return CoroutineManager.AddCoroutine(coroutine);
	}

	export class Coroutine<TReturn = any>
	{
		private readonly iterator: Generator<YieldInstruction | Coroutine, TReturn, unknown> = null;
		private iteratorResult: IteratorResult<unknown, any> = null;
		private bIsCompleted: boolean = false;

		get IsCompleted(): boolean { return  this.bIsCompleted }
		protected get Value(): any { return this.iteratorResult?.value; }

		constructor( iterator: Generator<YieldInstruction | Coroutine, TReturn, unknown> )
		{
			this.iterator = iterator;
		}

		protected async Update( deltaTime: number ): Promise<boolean>
		{
			if (this.iteratorResult?.done)
			{
				this.bIsCompleted = true;
				return false; // Coroutine completed
			}

			this.iteratorResult = this.iteratorResult || this.iterator.next();

			// TODO Evaluate the idea of merging under one common interface
			if ( GenericUtils.IsTypeOf( this.iteratorResult?.value, YieldInstruction ) )
			{
				if( this.iteratorResult.value['Update'](deltaTime) )
				{
					this.iteratorResult = this.iterator.next(this.iteratorResult?.value['Value']);
				}
			}
			if ( GenericUtils.IsTypeOf(this.iteratorResult?.value, Coroutine ) )
			{
				if ( !await this.iteratorResult.value['Update'](deltaTime) )
				{
					this.iteratorResult = this.iterator.next(this.iteratorResult?.value['Value']);
				}
			}
			if ( GenericUtils.IsPromise<TReturn>( this.iteratorResult?.value ) )
			{
				let result: TReturn = undefined;
				try{
					result = await this.iteratorResult.value;
				}
				catch(e) {}

				this.iteratorResult = this.iterator.return(result);
			}
			return true; // Is Still busy
		}
	}

	class CoroutineManager
	{
		private static bIsRunning: boolean = false;
		private static iPrevTickTime: number = Date.now();
		private static readonly Coroutines = new Map<string, Coroutine>();


		/////////////////////////////////////////////////////////////////////////////////////////
		public static AddCoroutine<TReturn>(iterator: Generator<YieldInstruction | Coroutine, TReturn, unknown>): Coroutine<TReturn>
		{
			const newCoroutine = new Coroutine<TReturn>(iterator);
			CoroutineManager.Coroutines.set( UniqueID.Generate(), newCoroutine );

			if ( !CoroutineManager.bIsRunning )
			{
				CoroutineManager.bIsRunning = true;
				setTimeout( CoroutineManager.Update, 0.0, 0.0 );
			}
			return newCoroutine;
		}

		/////////////////////////////////////////////////////////////////////////////////////////
		private static async Update( deltaTime: number )
		{
			for( const [coroutineId, coroutine] of CoroutineManager.Coroutines )
			{
				if ( !await coroutine['Update'](deltaTime))
				{
					CoroutineManager.Coroutines.delete(coroutineId);
				}
			}

			{
				if ( CoroutineManager.Coroutines.size > 0 )
				{
					const now = Date.now();
					setTimeout( CoroutineManager.Update, 0.0, now - CoroutineManager.iPrevTickTime );
					CoroutineManager.iPrevTickTime = now;
				}
				else
				{
					CoroutineManager.bIsRunning = false;
				}
			}
		}
	}
}

export namespace AsyncCoroutines
{
	export function WaitForMilliseconds(timeMS: number)
	{
		return new Promise( resolve => setTimeout(resolve, timeMS) );
	}

	export async function WaitUntil(predicate: () => boolean)
	{
		while(!predicate()) { await GenericUtils.DelayMS(0); };
		return Promise.resolve();
	}
	
	export async function StartCoroutine<TReturn>(coroutine: Promise<TReturn>) : Promise<TReturn>
	{
		return await coroutine;
	}
}

/*

EXAMPLE
import {Coroutines} from '../../Common/Coroutine';

function* coroutine0()
{
	for(let index = 5; index < 9; index ++)
	{
		yield new Coroutines.WaitForMilliseconds(1000);
		console.log(index);
	}
}

function* coroutine1()
{
	// yield WaitUntil Instruction
	let bCanContinue = false;
	setTimeout(() => { bCanContinue = true; console.log('start'); }, 1750);
	yield new Coroutines.WaitUntil( () => bCanContinue );
	
	// yield another coroutine
	yield Coroutines.StartCoroutine(coroutine0());

	for(let index = 0; index < 3; index ++)
	{
		// yield WaitForMilliseconds Instruction
		yield new Coroutines.WaitForMilliseconds(1000);
		console.log(index);
	}
}
const a: Coroutines.Coroutine =  Coroutines.StartCoroutine(coroutine1());

*/