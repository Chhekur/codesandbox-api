const firestore = require('./firestore')
const {firestoreGetSandboxById} = require ('./get')
const omit = require('@f/omit')

/**
 * firestoreDeleteDirectory - deletes directory from a sandbox
 * 
 * @param {string} sandboxId - id of the sandbox document
 * @param {string} directoryId - name of directory to be deleted
 * @returns {bool}
 * 	true if succeeded in deleting directory, false otherwise
 */
const firestoreDeleteDirectory = async function(sandboxId, directoryId){
	//console.log(`Deleting directory ${directoryId} from ${sandboxId}....`)

	try{
		let ref = firestore.collection('sandboxes').doc(sandboxId)
		let doc = await ref.get()
		let directories = {}
		if(doc.exists){
			let data = doc.data()
			directories = data.directories
			//console.log(`Found and read sandbox ${sandboxId}`)
		} else {
			console.log(`Couldn't find sandbox ${sandboxId}`)
			return false
		}

		let curDate = new Date()

		let directoriesToRemove = [directoryId]

		Object.keys(directories).forEach((key)=>{
			if(directories[key].directory_shortid && directories[key].directory_shortid == directoryId)
				directoriesToRemove.push(key)
		})

		let obj = {
			update_at: curDate.toISOString(),
			directories: omit(directoriesToRemove, directories),
		}

		ref.update(obj)
		//console.log(`Succesfully deleted director${directoriesToRemove.length > 1 ? "ies" : "y"} ${directoriesToRemove} from ${sandboxId}`)

		for(index in directoriesToRemove){
			let res = await ref.collection('modules').where("directory_shortid", "==", directoriesToRemove[index]).get()

			//console.log(`Deleting ${res.docs.length} module(s) from ${directoriesToRemove[index]}`)
			res.forEach((doc) => {
				doc.ref.delete()
			})
		}

		//console.log(`Succesfully deleted recursive modules from ${sandboxId}`)

		return true
	} catch(err){
		console.log(`Couldn't find and delete directory for sandbox ${sandboxId}`)
		console.log(err)
		return false
	}
	return false
}

/**
 * firestoreDeleteModule - deletes module from a sandbox
 * 
 * @param {string} sandboxId 	- id of the sandbox document
 * @param {string} moduleId 	- name of module to be deleted
 * @returns {bool}
 * 	true if succeeded in deleting module, false otherwise
 */
const firestoreDeleteModule = async function(sandboxId, moduleId){
	//console.log(`Deleting module ${moduleId} from ${sandboxId}....`)

	try{
		firestore.collection('sandboxes').doc(sandboxId).collection('modules').doc(moduleId).delete()
		//console.log(`Succesfully deleted module ${moduleId} from ${sandboxId}`)
		return true
	} catch(err){
		console.log(`Couldn't find and delete module for sandbox ${sandboxId}`)
		console.log(err)
		return false
	}
	return false
}

/**
 * firestoreDeleteSandboxById - deletes sandbox from firestore
 * 
 * @param {string} sandboxId - id of the sandbox document to be deleted
 * @returns {bool}
 * 	true if succeeded in deleting sandbox, false otherwise
 */
const firestoreDeleteSandboxById = (sandboxId) => {
	//console.log(`Deleting sandbox ${sandboxId}....`)
	try{
		firestore.collection('sandboxes').doc(sandboxId).delete()
	} catch(err){
		console.log(`Failed to delete ${sandboxId}`)
		console.log(err)
		return false;
	}
	//console.log(`Deleted sandbox ${sandboxId}`)

	return true;

}

/**
 * firestoreDeleteTag -deletes tag from a sandbox
 *		NOTE:currently deletes all matching tags (CodeSandbox shouldn't allow you to add duplicates though)
 * 
 * @param {string} sandboxId 	- id of the sandbox document
 * @param {string} tag 			- name of tag to be deleted
 * @returns {json}
	{
		error: false if succeeded, true if anything went wrong
		data: if there was an error, JSON like {title:["TO BE DONE"]}
				if everything went fine, an array of all the remaining tags of the sandbox
	}
 */
const firestoreDeleteTag = async function(sandboxId, tag){
	//console.log(`Deleting tag ${tag} from ${sandboxId}....`)

	try{
		let {error, data} = await firestoreGetSandboxById(sandboxId)
		if(error){
			//console.log("failed to get sandbox")
			return {error, data}
		}

		if(!data.tags){
			//console.log("no tags found for sandbox " + sandboxId)
			return {error, data:{title:["TO BE DONE"]}}
		}
		let newTags = data.tags.filter(existingTag=>existingTag != tag)
		let curDate = new Date()
		let obj = {
			update_at: curDate.toISOString(),
			tags: newTags
		}
		firestore.collection('sandboxes').doc(sandboxId).update(obj)
		//console.log(`Found and updated sandbox ${sandboxId}`)
		return {error:false, data:newTags}
	} catch(err){
		console.log(`Couldn't find and update tags for sandbox ${sandboxId}`)
		console.log(err)
		return {error:true, data:{title:["TO BE DONE"]}}
	}
}

/**
 * firestoreDeleteResource - deletes resource from a sandbox
 * 		NOTE: currently deletes all matching resources (CodeSandbox shouldn't allow you to add duplicates though)
 * 
 * @param {string} sandboxId 	- id of the sandbox document
 * @param {string} resource 	- name of resource to be deleted
 * @returns {json}
	{
		error: false if succeeded, true if anything went wrong
		data: if there was an error, JSON like {title:["TO BE DONE"]}
				if everything went fine, an array of all the remaining resources of the sandbox
	}
 */
const firestoreDeleteResource = async function(sandboxId, resource){
	//console.log(`Deleting resource ${resource} from ${sandboxId}....`)

	try{
		let {error, data} = await firestoreGetSandboxById(sandboxId)
		if(error){
			//console.log("failed to get sandbox")
			return {error, data}
		}

		if(!data.external_resources){
			//console.log("no resources found for sandbox " + sandboxId)
			return {error, data:{title:["TO BE DONE"]}}
		}
		let newResources = data.external_resources.filter(res=>res != resource)
		let curDate = new Date()
		let obj = {
			update_at: curDate.toISOString(),
			external_resources: newResources
		}
		firestore.collection('sandboxes').doc(sandboxId).update(obj)
		//console.log(`Found and updated sandbox ${sandboxId}`)
		return {error:false, data:newResources}
	} catch(err){
		console.log(`Couldn't find and update resources for sandbox ${sandboxId}`)
		console.log(err)
		return {error:true, data:{title:["TO BE DONE"]}}
	}
}

module.exports = {
    firestoreDeleteDirectory,
    firestoreDeleteModule,
    firestoreDeleteResource,
    firestoreDeleteSandboxById,
    firestoreDeleteTag,
}