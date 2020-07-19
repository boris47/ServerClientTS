//	import { ProcessManager } from "../../Common/ProcessManager";
//
//
//	export default class ServerCommunications
//	{
//		/**
//		 * @param listenAddress is a local IP address waiting for a connection.
//		 * @param listenPort local listening TCP port (the connection is waited on it).
//		 * @param connectAddress is a local or remote IP address (or DNS name) to which the incoming connection will be redirected.
//		 * @param connectPort is a TCP port to which the connection from listenport is forwarded to.
//		 */
//		public static async AddPortForwarding(listenAddress:string, listenPort:number, connectAddress:string, connectPort:number) : Promise<boolean>
//		{
//			const args = [`interface portproxy add v4tov4 listenport=${listenPort} listenaddress=${listenAddress} connectport=${connectPort} connectaddress=${connectAddress}`];
//			const result = await ProcessManager.Spawn.SpawnAsyncProcess( "netsh",null, args ).AsPromise();
//			return result.exitCode === 0;
//		}
//
//		/**
//		 * @param listenAddress is a local IP address waiting for a connection.
//		 * @param listenPort local listening TCP port (the connection is waited on it).
//		 */
//		public static async RemovePortForwarding(listenAddress:string, listenPort:number) : Promise<boolean>
//		{
//			const args = [`interface portproxy delete v4tov4 listenport=${listenPort} listenaddress=${listenAddress}`];
//			const result = await ProcessManager.Spawn.SpawnAsyncProcess( "netsh",null, args ).AsPromise();
//			return result.exitCode === 0;
//		}
//
//		/**
//		 * @param listenAddress is a local IP address waiting for a connection.
//		 * @param listenPort local listening TCP port (the connection is waited on it).
//		 */
//		public static async AddFirewallRule( listenAddress:string, listenPort:number ) : Promise<string|null>
//		{
//			const ruleName = `forwarded_RDPport_${listenPort}`;
//			const args = [`advfirewall firewall add rule name=”${ruleName}” protocol=TCP dir=in localip=${listenAddress}  localport=${listenPort} action=allow`];
//			const result = await ProcessManager.Spawn.SpawnAsyncProcess( "netsh", null, args ).AsPromise();
//			return result.exitCode === 0 ? ruleName : null;
//		}
//
//		/**
//		 * @param listenAddress is a local IP address waiting for a connection.
//		 * @param listenPort local listening TCP port (the connection is waited on it).
//		 */
//		public static async RemoveFirewallRule( ruleName: string ) : Promise<boolean>
//		{
//			const args = [`advfirewall firewall delete rule name=”${ruleName}”`];
//			const result = await ProcessManager.Spawn.SpawnAsyncProcess( "netsh", null, args ).AsPromise();
//			return result.exitCode === 0;
//		}
//	}