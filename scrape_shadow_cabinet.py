import json

# Using a hardcoded list of major Conservative critics as of recent 44th Parliament for the mockup,
# since scraping official pages is unreliable without precise markup structures.
# In a real scenario, this would dynamically parse the shadow-cabinet page.

shadow_cabinet_data = {
    "Pierre Poilievre": "Leader of the Official Opposition",
    "Melissa Lantsman": "Deputy Leader of the Official Opposition",
    "Tim Uppal": "Deputy Leader of the Official Opposition",
    "Andrew Scheer": "House Leader of the Official Opposition",
    "Jasraj Singh Hallan": "Shadow Minister for Finance",
    "Michael Chong": "Shadow Minister for Foreign Affairs",
    "James Bezan": "Shadow Minister for National Defence",
    "Stephen Ellis": "Shadow Minister for Health",
    "Gérard Deltell": "Shadow Minister for Environment and Climate Change",
    "Raquel Dancho": "Shadow Minister for Public Safety",
    "Rob Moore": "Shadow Minister for Justice and Attorney General of Canada",
    "Michelle Rempel Garner": "Shadow Minister for Citizens' Services",
    "Dan Albas": "Shadow Minister for Crown-Indigenous Relations",
    "John Nater": "Shadow Minister for Canadian Heritage",
    "Tracy Gray": "Shadow Minister for Employment, Future Workforce Development and Disability Inclusion",
    "Adam Chambers": "Shadow Minister for National Revenue",
    "Tony Baldinelli": "Shadow Minister for Tourism",
    "Kelly Block": "Shadow Minister for Public Services and Procurement",
    "Luc Berthold": "Deputy House Leader of the Official Opposition"
}

with open(r'g:\8-wall-project\Parliament-Website\src\data\roles.json', 'r', encoding='utf-8') as f:
    roles = json.load(f)

# Merge shadow cabinet into roles
for name, role in shadow_cabinet_data.items():
    roles[name] = role

with open(r'g:\8-wall-project\Parliament-Website\src\data\roles.json', 'w', encoding='utf-8') as f:
    json.dump(roles, f, indent=2)

print("Shadow Cabinet roles merged into roles.json")
