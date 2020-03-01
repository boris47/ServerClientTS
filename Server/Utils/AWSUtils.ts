

import * as AWS from 'aws-sdk';
import { RetryDelayOptions } from 'aws-sdk/lib/config';

import  * as GenericUtils from '../../Common/GenericUtils';


export namespace AWSUtils {

	export class S3 {

		/////////////////////////////////////////////////////////////////////////////////////////
		public static CreateInstance( accessKeyId : string, secretAccessKey : string, region: string, sessionToken? : string ) : AWS.S3
		{
			// Locking API Version and region
			const s3Instance = new AWS.S3( { apiVersion: '2016-11-15', region: region } );

			// Creates a Credentials object with a given set of credential information as positional arguments. 
			s3Instance.config.credentials = new AWS.Credentials( accessKeyId, secretAccessKey, sessionToken );

			// The maximum amount of retries to perform for a service request. Defaults to 10.
			s3Instance.config.maxRetries = 3600 / 5; // 720: This value grants 1 hour of retry

			// Returns A set of options to configure the retry delay on retryable errors.
			s3Instance.config.retryDelayOptions = <RetryDelayOptions>
			{
				// The base number of milliseconds to use in the exponential backoff for operation retries. Defaults to 100 ms.
	//			base : 5000,
				
				// A custom function that accepts a retry count and error and returns the amount of time to delay in milliseconds.
				// If the result is a non-zero negative value, no further retry attempts will be made.
				// The base option will be ignored if this option is supplied.
				customBackoff: ( retryCount: number, err?: Error | undefined ) : number =>
				{
					if ( err )
					{
						console.error( `[${err.name}]`, err.message );
					}
					// returns the amount of time to delay in milliseconds
					return ( s3Instance.config.maxRetries || 10 /* Default */ ) > retryCount ? 5000 : -1;
				}
			}

			return s3Instance;
		}


		/////////////////////////////////////////////////////////////////////////////////////////
		/**
		 * @returns AWS.S3.Object[] { Key : string, LastModified : Date, ETag : string, Size : number, StorageClass : string }
		 */
		public static async ListObjects( s3Instance : AWS.S3, bucketName : string , prefixes : string[] = new Array<string>(), bFilterFolders : boolean = false ) : Promise<AWS.S3.Object[] | null>
		{
			let objectsArray = new Array<AWS.S3.Object>();
			if ( prefixes.length === 0 ) prefixes.unshift("");

			const params : AWS.S3.ListObjectsV2Request = 
			{
				// Name of the bucket to list.
				Bucket: bucketName,
			};

			for ( let i = 0; i < prefixes.length; i++ )
			{
				const prefix : string = prefixes[i];
				params.Prefix = prefix; // Limits the response to keys that begin with the specified prefix.
				let bMustContinue = true, bErrorFound = false;
				while( bMustContinue && !bErrorFound )
				{
					await s3Instance.listObjectsV2( params ).promise()
					.then( ( output : AWS.S3.ListObjectsV2Output ) =>
					{
						params.ContinuationToken = output.NextContinuationToken;
						objectsArray.push( ...output.Contents.filter( ( o: AWS.S3.Object ) => bFilterFolders ? !o.Key.endsWith('/') : true ) );
						bMustContinue = output.IsTruncated;
					})
					.catch( ( error : AWS.AWSError ) =>
					{
						console.error( `AWSUtils:S3:ListAllObjects: There was a problem trying to list object from "${bucketName}"\nReason: ${error}` );
						objectsArray = null;
						bErrorFound = true;
					} )
				}
			}

			return objectsArray;
		}


		/////////////////////////////////////////////////////////////////////////////////////////
		public static async DownloadResource( s3Instance : AWS.S3, bucketName : string, key : string ) : Promise<Buffer | null>
		{
			return new Promise<Buffer | null>( ( resolve : ( value?: Buffer | null ) => void ) =>
			{
				const request = s3Instance.getObject( <AWS.S3.GetObjectRequest>
					{
						// The bucket name containing the object. When using this API with an access point, you must direct requests to the access point hostname.
						Bucket : bucketName,
						// Key of the object to get.
						Key : key,
					}
				);

				const buffers = [];
				request.on( 'httpData', ( chunk : Buffer | Uint8Array ) => buffers.push( chunk ) );
				request.on( 'httpDone', ( response : AWS.Response<AWS.S3.GetObjectOutput, AWS.AWSError> ) => resolve( Buffer.concat( buffers ) ) );
				request.on( 'error', ( err: AWS.AWSError, response: AWS.Response<AWS.S3.GetObjectOutput, AWS.AWSError> ) =>
				{
					console.error( `AWSUtils:S3:DownloadResource: There was a problem trying to download from "${bucketName}" key "${key} "\nError: ${err}` );
					resolve( null );
				});
				request.send();
			});
		}
		

		/////////////////////////////////////////////////////////////////////////////////////////
		public static async DownloadResources( s3Instance : AWS.S3, bucketName : string, keys : string[] ) : Promise<( Buffer | null )[]>
		{
			const promises = new Array<Promise<( Buffer | null )>>();
			const results = new Array<string>();
			keys.forEach( ( key: string ) =>
			{
				const promise = this.DownloadResource( s3Instance, bucketName, key );
				promise.then( (result) => result ? results.push( key ) : null );
				promises.push( promise );
			});
			return Promise.all( promises );
		}


		/////////////////////////////////////////////////////////////////////////////////////////
		public static async UploadResource( s3Instance : AWS.S3, bucketName : string, key : string, body : AWS.S3.Body ) : Promise<boolean>
		{
			return new Promise<boolean>( ( resolve : ( value?: boolean ) => void ) =>
			{
				s3Instance.putObject( <AWS.S3.PutObjectRequest>
					{
						// Bucket name to which the PUT operation was initiated. When using this API with an access point, you must direct requests to the access point hostname.
						Bucket: bucketName,
						// Object key for which the PUT operation was initiated.
						Key: key,
						// Object data.
						Body: body
					},
					( err : AWS.AWSError, data : AWS.S3.PutObjectOutput ) =>
					{
						if ( err )
						{
							console.error( `AWSUtils:S3:UploadResource: There was a problem trying to upload on "${bucketName}" with key "${key} file "${body}"\nError: ${err}` );
						}
						resolve( !err );
					}
				);
			});
		}


		/////////////////////////////////////////////////////////////////////////////////////////
		public static async UploadResources( s3Instance : AWS.S3, bucketName : string, keys : Map<string, Buffer> ) : Promise<string[]>
		{
			const promises = new Array<Promise<boolean>>();
			const results = new Array<string>();
			keys.forEach( ( value: Buffer, key: string ) =>
			{
				const promise = this.UploadResource( s3Instance, bucketName, key, value );
				promise.then( (bResult: boolean) => bResult ? results.push( key ) : null );
				promises.push( promise );
			});
			return Promise.all( promises ).then( () => results );
		}


		/////////////////////////////////////////////////////////////////////////////////////////
		public static async CopyObject( s3Instance : AWS.S3, sourceBucketName : string, destBucketName : string, key : string, bMustReplace : boolean = true ) : Promise<boolean>
		{
			return new Promise<boolean>( ( resolve : ( value?: boolean ) => void ) =>
			{
				s3Instance.copyObject( <AWS.S3.CopyObjectRequest>
					{
						// The name of the source bucket and key name of the source object, separated by a slash (/). Must be URL-encoded.
						CopySource: encodeURIComponent(`${sourceBucketName}/${key}`),
						// The name of the destination bucket.
						Bucket: destBucketName,
						// The key of the destination object.
						Key: key,
						// Specifies whether the metadata is copied from the source object or replaced with metadata provided in the request.
						MetadataDirective: ( bMustReplace ? "REPLACE" : "COPY" )
					},
					( err : AWS.AWSError, data : AWS.S3.CopyObjectOutput ) =>
					{
						if ( err )
						{
							console.error( `AWSUtils:S3:CopyObject: There was a problem copying from "${sourceBucketName}" to "${destBucketName}" of object "${key}"\nError: ${err}` );
						}
						resolve( !err );
					}
				)
			});
		}


		/////////////////////////////////////////////////////////////////////////////////////////
		public static async CopyObjects( s3Instance : AWS.S3, sourceBucketName : string, destBucketName : string, keys : string[], bMustReplace : boolean = true ) : Promise<string[]>
		{
			const promises = new Array<Promise<boolean>>();
			const results = new Array<string>();
			keys.forEach( key =>
			{
				const promise = this.CopyObject( s3Instance, sourceBucketName, destBucketName, key, bMustReplace );
				promise.then( (bResult: boolean) => bResult ? results.push( key ) : null );
				promises.push( promise );
			});
			return Promise.all( promises ).then( () => results );
		}


		/////////////////////////////////////////////////////////////////////////////////////////
		public static async RemoveResource( s3Instance : AWS.S3, bucketName : string, key : string ) : Promise<boolean>
		{
			const bResult = await new Promise<boolean>( ( resolve : ( value?: boolean ) => void ) =>
			{
				s3Instance.deleteObject( <AWS.S3.DeleteObjectRequest>
					{
						Bucket : bucketName,
						Key : key
					},
					( err : AWS.AWSError, data : AWS.S3.DeleteObjectOutput ) =>
					{
						if ( err )
						{
							console.error( `AWSUtils:S3:RemoveResource: There was a problem removing from "${bucketName}" the object "${key}"\nError: ${err}` );
						}
						resolve( !err );
					}
				)
			});
			return bResult;
		}


		/////////////////////////////////////////////////////////////////////////////////////////
		public static async RemoveResources( s3Instance : AWS.S3, bucketName : string, keys : string[] ) : Promise<string[]>
		{
			const promises = new Array<Promise<boolean>>();
			const results = new Array<string>();
			keys.forEach( key =>
			{
				const promise = this.RemoveResource( s3Instance, bucketName, key );
				promise.then( (bResult: boolean) => bResult ? results.push( key ) : null );
				promises.push( promise );
			});
			return Promise.all( promises ).then( () => results );
		}


		/////////////////////////////////////////////////////////////////////////////////////////
		public static async GetObjectMetadata( s3Instance : AWS.S3, bucketName : string, key : string ) : Promise<AWS.S3.HeadObjectOutput | null>
		{
			return new Promise<AWS.S3.HeadObjectOutput | null>( ( resolve : (value?: AWS.S3.HeadObjectOutput | null) => void ) => 
			{
				s3Instance.headObject( <AWS.S3.HeadObjectRequest>
					{
						Bucket: bucketName,
						Key: key
					},
					( err : AWS.AWSError, data : AWS.S3.HeadObjectOutput ) =>
					{
						if ( err )
						{
							console.error( `AWSUtils:GetObjectMetadata: There was a problem trying to get metadata for "${bucketName}/${key}"\nError: ${err}` );
						}
						resolve( err ? null : data );
					}
				);
			});
		}

	};



	/////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////    EC2    ///////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////


	export enum EInstanceStateCode {
		PENDING			= 0,
		RUNNING			= 16,
		SHUTTING_DOWN	= 32,
		TERMINATED		= 48,
		STOPPING		= 64,
		STOPPED			= 80
	};

	export enum EInstanceState {
		PENDING			= 'pending',
		RUNNING			= 'running',
		SHUTTING_DOWN	= 'shutting-down',
		TERMINATED		= 'terminated',
		STOPPING		= 'stopping',
		STOPPED			= 'stopped'
	};

	// INSTANCE IPs
	export interface IInstanceIPs {

		/** The public IPv4 address assigned to the instance, if applicable.
		 * 
		 * Ex: 52.59.253.214
		*/
		public_IPv4 : string;

		/**
		 * (IPv4 only) The public DNS name assigned to the instance. This name is not available until the instance enters the running state. 
		 * For EC2-VPC, this name is only available if you've enabled DNS hostnames for your VPC.
		 * 
		 * Ex: ec2-52-59-253-214.eu-central-1.compute.amazonaws.com
		 */
		public_IPv4_DNS : string;
	}

	export interface IEC2Configs {

	}

	export class EC2 {

		private readonly Configs = {
	
			/** Rapresent the timeout for waiting operations */
			WaitForStateChangeTimeoutMS : 300000, // 300 seconds = 5 minutes
		
			/** The time to wait before set as timed out when waiting for the instance reaching the desired state */
			WaitForStateChangeDelayMS : 3600 * 1000 * 60,
		
			/** In MILLISECONDS rapresents the time will be spent trying to shutting downs the machine on aws ec2 */
//			InstanceStopInstanceRetryTimeoutMS : 3600 * 1000,
		
			/** In MILLISECONDS the delay between the retry on instance emergency shutdown */
//			InstanceStopInstanceRetryDelayMS : 5000,
		
			/** In MILLISECONDS the timeout to wait for local connection to be established */
//			LocalNoConnectionTimeout : 300000,
		
			/** In MILLISECONDS the delay between the retry on local connection to be established*/
//			LocalNoConnectionRetryDelay : 2000
		
		};

		public static CreateInstance( accessKeyId : string, secretAccessKey : string, region: string, sessionToken? : string ) : AWS.EC2
		{
			// Locking API Version and region
			const ec2Instance = new AWS.EC2( { apiVersion: '2016-11-15', region: region } );

			// Creates a Credentials object with a given set of credential information as positional arguments. 
			ec2Instance.config.credentials = new AWS.Credentials( accessKeyId, secretAccessKey, sessionToken );

			// The maximum amount of retries to perform for a service request. Defaults to 10.
			ec2Instance.config.maxRetries = 3600 / 5; // 720: This value grants 1 hour of retry

			// Returns A set of options to configure the retry delay on retryable errors.
			ec2Instance.config.retryDelayOptions = <RetryDelayOptions>
			{
				// The base number of milliseconds to use in the exponential backoff for operation retries. Defaults to 100 ms.
	//			base : 5000,
				
				// A custom function that accepts a retry count and error and returns the amount of time to delay in milliseconds.
				// If the result is a non-zero negative value, no further retry attempts will be made.
				// The base option will be ignored if this option is supplied.
				customBackoff: ( retryCount: number, err?: Error | undefined ) : number =>
				{
					if ( err )
					{
						console.error( `[${err.name}]`, err.message );
					}
					// returns the amount of time to delay in milliseconds
					return ( ec2Instance.config.maxRetries || 10 /* Default */ ) > retryCount ? 5000 : -1;
				}
			}

			return ec2Instance;
		}

		/** Allow to start a specific instance
		 * @param InstanceID The ID of the instance.
		 * @returns Boolean result
		 */
		public async StartInstance( EC2Instance : AWS.EC2, InstanceID : string ) : Promise<boolean>
		{
			return new Promise<boolean>( ( resolve : (value : boolean) => void ) =>
			{
				EC2Instance.startInstances( <AWS.EC2.StartInstancesRequest>
					{
						InstanceIds : [InstanceID]
					},
					( err: AWS.AWSError, data: AWS.EC2.StartInstancesResult ) =>
					{
						if ( err )
						{
							console.error( `AWSUtils:EC2:StartInstance: There was a problem trying to start instance ${InstanceID}"\nError: ${err}` );
						}
						resolve( !err );
					}
				)
			});
		}


		/** Allow to stop a specific instance
		 * @param InstanceID The ID of the instance.
		 * @param bForce If true the method try to ensure the machine stopped amont a time interval of 1 hour
		 * @returns Boolean result
		 */
		public async StopInstance( EC2Instance : AWS.EC2, InstanceID : string, bForce : boolean = false ) : Promise<boolean>
		{
			return new Promise<boolean>( (resolve) =>
			{
				EC2Instance.stopInstances( <AWS.EC2.StopInstancesRequest>
					{
						InstanceIds : [InstanceID]
					},
					( err: AWS.AWSError, data: AWS.EC2.StopInstancesResult ) =>
					{
						if ( err )
						{
							console.error( `AWSUtils:EC2:StartInstance: There was a problem trying to stop instance ${InstanceID}"\nError: ${err}` );
						}
						resolve( !err );
					}
				)
			});
		}


		/**
		 * @param InstanceID The ID of the instance.
		 * @description Status Checks for Your Instances: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/monitoring-system-instance-status-check.html
		 * @description Troubleshooting: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/TroubleshootingInstances.html
		 * @description Instance Lifecycle: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-lifecycle.html
		 * @returns The Instance Status object or null
		 * 
		 * - System Status Checks
		 * 
		 * Monitor the AWS systems on which your instance runs.
		 * These checks detect underlying problems with your instance that require AWS involvement to repair. 
		 * When a system status check fails, you can choose to wait for AWS to fix the issue, or you can resolve it yourself. 
		 * For instances backed by Amazon EBS, you can stop and start the instance yourself, which in most cases results in the instance being migrated to a new host. 
		 * For instances backed by instance store, you can terminate and replace the instance.
		 * The following are examples of problems that can cause system status checks to fail:
		 * 
		 * 1) Loss of network connectivity
		 * 
		 * 2) Loss of system power
		 * 
		 * 3) Software issues on the physical host
		 * 
		 * 4) Hardware issues on the physical host that impact network reachability
		 * 
		 * -------------------------------------------------------
		 * 
		 * - Instance Status Checks
		 * 
		 * Monitor the software and network configuration of your individual instance.
		 * Amazon EC2 checks the health of the instance by sending an address resolution protocol (ARP) request to the network interface (NIC). 
		 * These checks detect problems that require your involvement to repair. 
		 * When an instance status check fails, you typically must address the problem yourself (for example, by rebooting the instance or by making instance configuration changes).
		 * The following are examples of problems that can cause instance status checks to fail:
		 * 
		 * 1) Failed system status checks
		 * 
		 * 2) Incorrect networking or startup configuration
		 * 
		 * 3) Exhausted memory
		 * 
		 * 4) Corrupted file system
		 * 
		 * 5) Incompatible kernel
		 */
		public async DescribeInstanceStatus( EC2Instance : AWS.EC2, InstanceID : string ) : Promise<AWS.EC2.InstanceStatus | null>
		{
			const status : AWS.EC2.InstanceStatus | null = await this.DescribeInstanceStatus_Internal( EC2Instance, InstanceID );
			if ( !status )
			{
				console.error( `AWSUtils:EC2:DescribeInstanceStatus: Cannot describe status for instance ${InstanceID}!!` );
			}
			return status;
		}


		/** EC2 returns information for specified instance
		 * @param InstanceID The ID of the instance.
		 * @returns AWS.EC2.DescribeInstancesResult or null
		 */
		public async DescribeInstance( EC2Instance : AWS.EC2, InstanceID : string ) : Promise<AWS.EC2.Instance | null>
		{
			const result = await new Promise<AWS.EC2.DescribeInstancesResult | null>( (resolve) =>
			{
				EC2Instance.describeInstances( <AWS.EC2.DescribeInstancesRequest>
					{
						InstanceIds : [InstanceID]
					},
					( err: AWS.AWSError, data: AWS.EC2.DescribeInstancesResult ) =>
					{
						if ( err )
						{
							console.error( `AWSUtils:EC2:StartInstance: There was a problem trying to describe instance ${InstanceID}"\nError: ${err}` );
						}
						resolve( !err ? data : null );
					}
				)
			} );

			if ( result && result.Reservations && result.Reservations[0].Instances )
			{
				const instanceData : AWS.EC2.Instance | undefined = result.Reservations[0].Instances.find( i => i.InstanceId === InstanceID );
				if ( instanceData )
				{
					return instanceData;
				}
			}

			console.error( `AWSUtils:EC2:DescribeInstance: Cannot describe instance ${InstanceID}!!` );
			debugger;
			return null;
		}


		/** GetInstanceIPs of a aws instance
		 * @param InstanceID The ID of the instance.
		 * @returns an IInstanceIPs object or null
		 */
		public async GetInstanceIPs( EC2Instance : AWS.EC2, InstanceID : string ) : Promise<IInstanceIPs | null>
		{
			const instanceData : AWS.EC2.Instance | null = await this.DescribeInstance( EC2Instance, InstanceID );
			if ( instanceData )
			{
				const responseObject : IInstanceIPs =
				{
					public_IPv4 : instanceData.PublicIpAddress || '',
					public_IPv4_DNS : instanceData.PublicDnsName || ''
				}
				return responseObject;
			}

			console.error( `AWSUtils:EC2:GetInstanceIPs: Cannot get ips for instance ${InstanceID}!!` );
			debugger;
			return null;
		}


		/** Check if desired instance has the desired state
		 * @param InstanceID The ID of the instance.
		 * @param desiredState The state of the instance you want the istance is set to
		 * @returns A boolean value that is true if the instance is set on desired state, false if not, null if unable to get state
		 */
		public async HasInstanceDesiredState( EC2Instance : AWS.EC2, InstanceID : string, desiredState : EInstanceStateCode ) : Promise<boolean | null>
		{
			const status : AWS.EC2.InstanceStatus | null = await this.DescribeInstanceStatus_Internal( EC2Instance, InstanceID );
			if ( status && status.InstanceState )
			{
				return status.InstanceState.Code === desiredState;
			}

			console.error( `AWSUtils:EC2:HasInstanceDesiredState: Cannot chech status for instance ${InstanceID}!!` );
			debugger;
			return null;
		}


		/**  Wait for an instance to reach a specific instance state
		 * @param InstanceID The ID of the instance.
		 * @param desiredState The state of the instance you want to wait the instance switch to
		 * @returns A boolean value that is true if the instance is set on desired state, false is ignored, null on any critical problem
		 */
		public async WaitForInstanceStateChange( EC2Instance : AWS.EC2, InstanceID : string, desiredState : EInstanceStateCode, desiredSystemStatus? : AWS.EC2.SummaryStatus ) : Promise<boolean | null>
		{
			// Set Time Out
			let bForcedToReturn = false;
			{
				let timerRef : NodeJS.Timeout;
				const afterCallback = () => {
					bForcedToReturn = true;
					clearTimeout( timerRef );
				};
				timerRef = setTimeout( afterCallback, this.Configs.WaitForStateChangeTimeoutMS );
			}

			let status : AWS.EC2.InstanceStatus | null = null
			let bIsConditionSatisfied : boolean = false;
			while ( bForcedToReturn === false && bIsConditionSatisfied === false )
			{
				status = await this.DescribeInstanceStatus_Internal( EC2Instance, InstanceID );
				if( status )
				{
					if ( status.InstanceState )
					{
						/** 0 : pending
						 * 16 : running
						 * 32 : shutting-down
						 * 48 : terminated
						 * 64 : stopping
						 * 80 : stopped
						 */
						const bInstanceStateEquals = status.InstanceState.Code === desiredState;
						const bSystemStatusEquals = ( desiredSystemStatus && status.SystemStatus ) ? status.SystemStatus.Status === desiredSystemStatus : true;
						bIsConditionSatisfied = ( bInstanceStateEquals && bSystemStatusEquals );
					}
					else
					{
						console.error( `AWSUtils:EC2:WaitForInstanceStateChange: Failed to obtain Instance State of ${InstanceID}` );
						debugger;
					}
				}
				else
				{
					console.error( `AWSUtils:EC2:WaitForInstanceStateChange: Failed to Describe Instance of ${InstanceID}` );
					debugger;
				}

				await GenericUtils.DelayMS( this.Configs.WaitForStateChangeDelayMS );
			}

			// Timeout is reached
			if ( bForcedToReturn )
			{
				console.error( "AWSUtils:EC2:WaitForInstanceStateChange: Forced to return because timeout reached!!!" );
				debugger;
				return null
			}

			return true;
		}


		/** Describes the specified attribute of the specified instance.
		 * You can specify only one attribute at a time. 
		 * 
		 * Valid attribute values are:
		 * instanceType | kernel | ramdisk | userData | disableApiTermination | 
		 * instanceInitiatedShutdownBehavior | rootDeviceName | blockDeviceMapping | productCodes | sourceDestCheck | groupSet | ebsOptimized | sriovNetSupport
		 * 
		 * @param InstanceID The ID of the instance.
		 * @param attribute The attribute to get description
		 */
		public async DescribeInstanceAttribute( EC2Instance : AWS.EC2, InstanceID : string, attribute : AWS.EC2.InstanceAttributeName ) : Promise<AWS.EC2.InstanceAttribute | null>
		{
			return new Promise<AWS.EC2.InstanceAttribute | null>( ( resolve : (value : AWS.EC2.InstanceAttribute | null ) => void ) =>
			{
				EC2Instance.describeInstanceAttribute( <AWS.EC2.DescribeInstanceAttributeRequest>
					{
						InstanceId : InstanceID,
						Attribute : attribute
					},
					( err: AWS.AWSError, data: AWS.EC2.InstanceAttribute ) =>
					{
						if ( err )
						{
							console.error( `AWSUtils:EC2:DescribeInstanceAttribute: There was a problem trying to describe instance attribute ${attribute} for instance ${InstanceID}"\nError: ${err}` );
						}
						resolve( !err ? data : null );
					}
				)
			});
		}


		/** Allow to modifiy an instance attribute
		 * 
		 * @param InstanceID The ID of the instance.
		 * @param attributeName The attribute to modify
		 * @returns A bolean indicating if th change can be made, null if command is not allowed
		 */
		public async ModifyInstanceAttribute( EC2Instance : AWS.EC2, InstanceID : string, attributeName : AWS.EC2.InstanceAttributeName, value : string ) : Promise<boolean | null>
		{
			return new Promise<boolean>( (resolve) =>
			{
				const params : AWS.EC2.ModifyInstanceAttributeRequest =
				{
					// The ID of the instance.
					InstanceId : InstanceID
				};
				params[attributeName] = { Value : value };
				EC2Instance.modifyInstanceAttribute
				(
					params,
					( err: AWS.AWSError, data: {} ) =>
					{
						if ( err )
						{
							console.error( `AWSUtils:EC2:ModifyInstanceAttribute: There was a problem trying to modify instance attribute ${attributeName} for instance ${InstanceID}"\nError: ${err}` );
						}
						resolve( !err );
					}
				)
			} );
		}


		/** Internal version of this function, without any verbose output into program console */
		private async DescribeInstanceStatus_Internal( EC2Instance : AWS.EC2, InstanceID : string ) : Promise<AWS.EC2.InstanceStatus | null>
		{
			const status : AWS.EC2.DescribeInstanceStatusResult | null = await new Promise<AWS.EC2.DescribeInstanceStatusResult | null>( (resolve) =>
			{
				EC2Instance.describeInstanceStatus( <AWS.EC2.DescribeInstanceStatusRequest>
					{
						InstanceIds : [InstanceID],
						IncludeAllInstances: true
					},
					( err: AWS.AWSError, data: AWS.EC2.DescribeInstanceStatusResult ) =>
					{
						resolve( !err ? data : null );
					}
				)
			} );

			if ( status && status.InstanceStatuses )
			{
				const instanceStatus = status.InstanceStatuses.find( i => i.InstanceId === InstanceID );
				if ( instanceStatus )
				{
					return instanceStatus;
				}
			}

			debugger;
			return null;
		}

		
		private static GetInstanceStateNameByCode( code: EInstanceStateCode ) : string
		{
			let name : string = "NONE";
			switch (code)
			{
				case EInstanceStateCode.PENDING:
				{
					name = EInstanceState.PENDING;
					break;
				}

				case EInstanceStateCode.RUNNING:
				{
					name = EInstanceState.RUNNING;
					break;
				}

				case EInstanceStateCode.SHUTTING_DOWN:
				{
					name = EInstanceState.SHUTTING_DOWN;
					break;
				}

				case EInstanceStateCode.STOPPED:
				{
					name = EInstanceState.STOPPED;
					break;
				}

				case EInstanceStateCode.STOPPING:
				{
					name = EInstanceState.STOPPING;
					break;
				}

				case EInstanceStateCode.TERMINATED:
				{
					name = EInstanceState.TERMINATED;
					break;
				}
			}
			return name;
		}

	};

}