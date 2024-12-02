use anyhow::Result;
use serde_json::json;
use reqwest::Client;

#[tokio::main]
async fn main() -> Result<()> {
    let client = Client::new();
    
    // Upload test documents
    let documents = vec![
        json!({
            "type": "text",
            "content": {
                "content": "Machine learning is a fascinating field of artificial intelligence",
                "title": "ML Intro",
                "metadata": {
                    "author": "Test Author",
                    "tags": ["ml", "ai"]
                }
            }
        }),
        json!({
            "type": "text",
            "content": {
                "content": "Natural language processing helps computers understand human language",
                "title": "NLP Basics",
                "metadata": {
                    "author": "Test Author",
                    "tags": ["nlp", "ai"]
                }
            }
        }),
    ];

    for doc in documents {
        let resp = client.post("http://localhost:3030/documents")
            .json(&doc)
            .send()
            .await?;

        println!("Upload response: {:?}", resp.text().await?);
    }

    Ok(())
}