from sklearn.datasets import load_wine
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

wine = load_wine(as_frame=True)
df = wine.frame
df["cepage"] = wine.target_names[wine.target]

train, test = train_test_split(df, test_size=0.3, random_state=42)
model = RandomForestClassifier()
model.fit(train, train["cepage"])
print(model.score(test, test["cepage"]))
