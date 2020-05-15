

declare module 'vue/types/vue'
{
	interface Vue
	{    
	//	$sync<T=any>(key: keyof this, value: T): void;
	}

	// Global properties can be declared
	// on the `VueConstructor` interface
	interface VueConstructor
	{

	}
}