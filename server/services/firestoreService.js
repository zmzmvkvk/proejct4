const { db } = require("../config/firebase");

class FirestoreService {
  // 프로젝트 관련 CRUD
  async getAllProjects() {
    const snapshot = await db.collection("projects").get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async createProject(projectData) {
    const docRef = await db.collection("projects").add(projectData);
    return { id: docRef.id, ...projectData };
  }

  async deleteProject(projectId) {
    await db.collection("projects").doc(projectId).delete();
    return { success: true };
  }

  // 프로젝트별 에셋 관련 CRUD
  async getProjectAssets(projectId) {
    const assetsRef = db
      .collection("projects")
      .doc(projectId)
      .collection("assets");
    const snapshot = await assetsRef.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async createProjectAsset(projectId, assetData) {
    const docRef = await db
      .collection("projects")
      .doc(projectId)
      .collection("assets")
      .add(assetData);
    return { id: docRef.id, ...assetData };
  }

  async toggleProjectAssetFavorite(projectId, assetId) {
    const assetRef = db
      .collection("projects")
      .doc(projectId)
      .collection("assets")
      .doc(assetId);
    
    const assetDoc = await assetRef.get();
    if (!assetDoc.exists) {
      throw new Error("Asset not found");
    }
    
    const current = assetDoc.data();
    const updated = { ...current, isFavorite: !current.isFavorite };
    await assetRef.set(updated);
    return { success: true, asset: updated };
  }

  async saveProjectAssetsFromLeonardo(projectId, leonardoElements) {
    const assetsRef = db
      .collection("projects")
      .doc(projectId)
      .collection("assets");

    for (const element of leonardoElements) {
      if (!element.id) continue;
      
      const assetData = {
        name: element.name,
        triggerWord: element.instancePrompt,
        category: element.focus,
        status: element.status,
        imageUrl: element.thumbnailUrl || "https://placehold.co/300x300?text=No+Image",
        isFavorite: false,
        userLoraId: element.id,
        instancePrompt: element.instancePrompt,
        focus: element.focus,
      };
      
      await assetsRef.doc(element.id).set(assetData);
    }
  }

  // 전역 에셋 관련 CRUD
  async getAllAssets() {
    const assetsRef = db.collection("assets");
    const snapshot = await assetsRef.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async createAsset(assetData) {
    const docRef = await db.collection("assets").add(assetData);
    return { id: docRef.id, ...assetData };
  }

  async toggleAssetFavorite(assetId) {
    const assetRef = db.collection("assets").doc(assetId);
    const assetDoc = await assetRef.get();
    
    if (!assetDoc.exists) {
      throw new Error("Asset not found");
    }
    
    const current = assetDoc.data();
    const updated = { ...current, isFavorite: !current.isFavorite };
    await assetRef.set(updated);
    return { success: true, asset: updated };
  }

  async saveAssetsFromLeonardo(leonardoElements) {
    const assetsRef = db.collection("assets");
    
    for (const element of leonardoElements) {
      if (!element.id) continue;
      
      const assetData = {
        name: element.name,
        triggerWord: element.instancePrompt,
        category: element.focus,
        status: element.status,
        imageUrl: element.thumbnailUrl || "https://placehold.co/300x300?text=No+Image",
        isFavorite: false,
        userLoraId: element.id,
        instancePrompt: element.instancePrompt,
        focus: element.focus,
      };
      
      await assetsRef.doc(element.id).set(assetData);
    }
  }
}

module.exports = new FirestoreService();