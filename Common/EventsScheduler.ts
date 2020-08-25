import { UniqueID } from "./Utils/GenericUtils";


export interface IScheduledEvent
{
	/** Milliseconds to every repeat (Read-Only) */
	readonly repeatTime: number;
	
	/** The callback */
	readonly callback: Function;

	readonly isPaused: boolean;

	ID(): string;
}

interface IScheduledEventPrivate
{
	id: string;

	context: object;

	remainigTime: number;
}


export default class EventsScheduler
{
	private static readonly THICKS_REFRESH = 100;

	private events = new Map<string, IScheduledEvent & IScheduledEventPrivate>();

	private intervalRef : any;

	constructor()
	{
		this.intervalRef = global.setInterval( this.UpdateInstance, EventsScheduler.THICKS_REFRESH, this );
	}

	private UpdateInstance(instance: EventsScheduler)
	{
		for(const [eventId, event] of instance.events)
		{
			if (event.remainigTime > 0.0)
			{
				event.remainigTime -= EventsScheduler.THICKS_REFRESH;
			}
			else
			{
				event.remainigTime = event.repeatTime;
				event.callback.apply(event.context);
			}
		}
	}

	/**
	 * @param repeatTime Milliseconds to every repeat (100ms minimum)
	 * @param callback The callback
	 * @param eventId `(Optional)` The id of a known event that need update with fresh options
	 */
	public SetEvent( repeatTime: number, callback: Function, context?: object, eventId?: string ): string
	{
		let id = eventId;
		if ( !this.events.has(eventId) )
		{
			id = UniqueID.Generate();
		}
		const event : IScheduledEvent & IScheduledEventPrivate =
		{
			// Public
			repeatTime : Math.max( repeatTime, 100 ),
			callback,
			isPaused: false,
			ID : () => id,

			// Private
			id,
			context: context,
			remainigTime : repeatTime
		};
		this.events.set( id, event );
		return id;
	}

	/**
	 * @param eventId The event id to stop
	 * @returns {Boolean} True for Success otherwise false for failure
	 */
	public RemoveEvent(eventId: string): boolean
	{
		return this.events.delete(eventId);
	}

	/**
	 * 
	 */
	public Resume()
	{
		this.intervalRef = setInterval( this.UpdateInstance, EventsScheduler.THICKS_REFRESH, this );
	}

	/**
	 * 
	 */
	public Stop()
	{
		clearInterval(this.intervalRef);
		this.intervalRef = null;
	}
}